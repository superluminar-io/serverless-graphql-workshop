import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as appSync from '@aws-cdk/aws-appsync';
import {Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal} from '@aws-cdk/aws-iam';
import {Code, Function, Runtime} from "@aws-cdk/aws-lambda";

enum GraphQLType { QUERY = 'Query', MUTATION = 'Mutation' }

export class InfrastructureStack6 extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const articleName = 'Article';
    const commentName = 'Comment';

    /////////// DATABASE TABLES & ROLES ///////////

    const articleTable = new dynamodb.Table(this, articleName, {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {name: 'id', type: dynamodb.AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY // Note: Only for testing purposes!
    });

    const articlesTableRole = new Role(this, `${articleName}DynamoDBRole`, {
      assumedBy: new ServicePrincipal('appsync.amazonaws.com')
    });
    articlesTableRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));

    const commentTable = new dynamodb.Table(this, commentName, {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {name: 'articleId', type: dynamodb.AttributeType.STRING},
      sortKey: {name: 'createdAt', type: dynamodb.AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY // Note: Only for testing purposes!
    });

    const commentsTableRole = new Role(this, `${commentName}DynamoDBRole`, {
      assumedBy: new ServicePrincipal('appsync.amazonaws.com')
    });
    commentsTableRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));


    /////////// GRAPHQL API ///////////

    const blogsGraphQLApi = new appSync.CfnGraphQLApi(this, 'BlogApi', {
      name: 'blog-api-6',
      authenticationType: appSync.AuthorizationType.API_KEY
    });

    new appSync.CfnApiKey(this, 'BlogApiKey', {
      apiId: blogsGraphQLApi.attrApiId
    });


    /////////// GRAPHQL API SCHEMA ///////////

    const apiSchema = new appSync.CfnGraphQLSchema(this, 'BlogSchema', {
      apiId: blogsGraphQLApi.attrApiId,
      definition: `
        type ${articleName} {
          id: ID!
          createdAt: AWSDateTime!
          title: String!
          content: String!
          comments: [${commentName}!]!
        }
        
        type ${commentName} {
          id: ID!
          createdAt: String!
          content: String!
        }
        
        type Mutation {
          createArticle(title: String!, content: String!): ${articleName}!
          createComment(articleId: ID!, content: String!): ${commentName}!
        }
        
        type Query {
          article(id: ID!): ${articleName}
        }
        
        schema {
          query: Query,
          mutation: Mutation
        }
      `
    });


    /////////// GRAPHQL DATA SOURCES ///////////

    const articleDataSource = new appSync.CfnDataSource(this, 'articleDataSource', {
      apiId: blogsGraphQLApi.attrApiId,
      name: `${articleName}DataSource`,
      type: 'AMAZON_DYNAMODB',
      dynamoDbConfig: {
        tableName: articleTable.tableName,
        awsRegion: this.region,
      },
      serviceRoleArn: articlesTableRole.roleArn,
    });
    articleDataSource.addDependsOn(apiSchema);

    const commentsDataSource = new appSync.CfnDataSource(this, 'commentsDataSource', {
      apiId: blogsGraphQLApi.attrApiId,
      name: `${commentName}DataSource`,
      type: 'AMAZON_DYNAMODB',
      dynamoDbConfig: {
        tableName: commentTable.tableName,
        awsRegion: this.region,
      },
      serviceRoleArn: commentsTableRole.roleArn,
    });
    commentsDataSource.addDependsOn(apiSchema);


    /////////// GRAPHQL DATA SOURCE - BAD EMOJI LAMBDA FUNCTION ///////////

    const hasBadEmojisLambda = new Function(this, 'hasBadEmojisLambda', {
      runtime: Runtime.NODEJS_12_X,
      code: Code.fromAsset('lambda'),
      handler: 'commentValidator.handler'
    });

    const hasBadEmojisRole = new Role(this, 'hasBadEmojisRole', {
      assumedBy: new ServicePrincipal('appsync.amazonaws.com')
    });
    const policyStatement = new PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [hasBadEmojisLambda.functionArn],
      effect: Effect.ALLOW,
    });
    hasBadEmojisRole.addToPolicy(policyStatement);

    const hasBadEmojisDataSource = new appSync.CfnDataSource(this, 'hasBadEmojisDataSource', {
      apiId: blogsGraphQLApi.attrApiId,
      lambdaConfig: {
        lambdaFunctionArn: hasBadEmojisLambda.functionArn
      },
      serviceRoleArn: hasBadEmojisRole.roleArn,
      type: 'AWS_LAMBDA',
      name: 'hasBadEmojiDataSource'
    });
    hasBadEmojisDataSource.addDependsOn(apiSchema);


    /////////// GRAPHQL RESOLVERS ///////////

    const storeArticlesResolver = new appSync.CfnResolver(this, 'storeArticlesResolver', {
      apiId: blogsGraphQLApi.attrApiId,
      typeName: GraphQLType.MUTATION,
      fieldName: 'createArticle',
      dataSourceName: articleDataSource.name,
      requestMappingTemplate: `{
        "version": "2017-02-28",
        "operation": "PutItem",
        "key": {
          "id": $util.dynamodb.toDynamoDBJson($util.autoId()),
          "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
        },
        "attributeValues" : $util.dynamodb.toMapValuesJson($ctx.args)
      }`,
      responseMappingTemplate: `$util.toJson($ctx.result)`
    });
    storeArticlesResolver.addDependsOn(articleDataSource);

    const queryArticlesResolver = new appSync.CfnResolver(this, 'queryArticlesResolver', {
      apiId: blogsGraphQLApi.attrApiId,
      typeName: GraphQLType.QUERY,
      fieldName: 'article',
      dataSourceName: articleDataSource.name,
      requestMappingTemplate: `{
        "version": "2017-02-28",
        "operation": "GetItem",
        "key": {
          "id": $util.dynamodb.toDynamoDBJson($ctx.args.id),
        }
      }`,
      responseMappingTemplate: `$util.toJson($ctx.result)`
    });
    queryArticlesResolver.addDependsOn(articleDataSource);

    const queryCommentsResolver = new appSync.CfnResolver(this, 'queryCommentsResolver', {
      apiId: blogsGraphQLApi.attrApiId,
      typeName: articleName,
      fieldName: 'comments',
      dataSourceName: commentsDataSource.name,
      requestMappingTemplate: `{
        "version" : "2017-02-28",
        "operation" : "Query",
        "query": {
          "expression": "articleId = :articleId",
          "expressionValues" : {
            ":articleId" : $util.dynamodb.toDynamoDBJson($ctx.source.id)
          }
        },
        "limit": $util.defaultIfNull($ctx.args.limit, 20),
        "nextToken": $util.toJson($util.defaultIfNullOrBlank($ctx.args.nextToken, null))
      }`,
      responseMappingTemplate: `{
        "nodes": $util.toJson($ctx.result.items),
        "nextToken": $util.toJson($util.defaultIfNullOrBlank($context.result.nextToken, null))
      }`,
    });
    queryCommentsResolver.addDependsOn(commentsDataSource);


    /////////// GRAPHQL FUNCTIONS ///////////

    const verifyArticleIdFunction = new appSync.CfnFunctionConfiguration(this, 'verifyArticleIdFunction', {
      apiId: blogsGraphQLApi.attrApiId,
      name: 'verifyArticleId',
      dataSourceName: articleDataSource.name,
      functionVersion: '2018-05-29',
      requestMappingTemplate: `{
        "operation": "GetItem",
        "key": {
          "id": $util.dynamodb.toDynamoDBJson($ctx.stash.articleId),
        }
      }`,
      responseMappingTemplate: `
      #if($util.isNull($ctx.result))
        $util.error("Article ID is not valid!")
      #end
      
      {}`,
    });
    verifyArticleIdFunction.addDependsOn(articleDataSource);

    const hasBadEmojisFunction = new appSync.CfnFunctionConfiguration(this, 'hasBadEmojisFunction', {
      apiId: blogsGraphQLApi.attrApiId,
      functionVersion: '2018-05-29',
      dataSourceName: hasBadEmojisDataSource.name,
      name: 'hasBadEmojisFunction',
      requestMappingTemplate: `{
        "operation": "Invoke",
        "payload": {
          "content": $util.toJson($ctx.stash.content)
        }
      }`,
      responseMappingTemplate: `
      #if($context.result.hasBadEmojis)
        $util.error("Content includes bad emojis :(")
      #end
      {}`
    });
    hasBadEmojisFunction.addDependsOn(hasBadEmojisDataSource);

    const storeCommentsFunction = new appSync.CfnFunctionConfiguration(this, 'storeCommentsFunction', {
      apiId: blogsGraphQLApi.attrApiId,
      functionVersion: '2018-05-29',
      dataSourceName: commentsDataSource.name,
      name: 'storeCommentsFunction',
      requestMappingTemplate: `{
        "version" : "2017-02-28",
        "operation" : "PutItem",
        "key" : {
          "articleId": $util.dynamodb.toDynamoDBJson($ctx.stash.articleId),
          "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
        },
        "attributeValues" : {
          "id": $util.dynamodb.toDynamoDBJson($util.autoId()),
          "content": $util.dynamodb.toDynamoDBJson($ctx.stash.content)
        }
      }`,
      responseMappingTemplate: `$util.toJson($ctx.result)`,
    });
    storeCommentsFunction.addDependsOn(commentsDataSource);


    /////////// GRAPHQL PIPELINE RESOLVER ///////////

    const createCommentsResolver = new appSync.CfnResolver(this, 'createCommentsResolver', {
      apiId: blogsGraphQLApi.attrApiId,
      typeName: GraphQLType.MUTATION,
      fieldName: 'createComment',
      kind: 'PIPELINE',
      pipelineConfig: {
        functions: [verifyArticleIdFunction.attrFunctionId, hasBadEmojisFunction.attrFunctionId, storeCommentsFunction.attrFunctionId]
      },
      requestMappingTemplate: `
      $util.qr($ctx.stash.put("articleId", $ctx.args.articleId))
      $util.qr($ctx.stash.put("content", $ctx.args.content))

      {}`,
      responseMappingTemplate: `$util.toJson($ctx.result)`
    });
    createCommentsResolver.addDependsOn(verifyArticleIdFunction);
    createCommentsResolver.addDependsOn(hasBadEmojisFunction);
    createCommentsResolver.addDependsOn(storeCommentsFunction);
  }
}

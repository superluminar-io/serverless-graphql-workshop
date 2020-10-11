import * as cdk from '@aws-cdk/core';
import {Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal} from '@aws-cdk/aws-iam';
import {Code, Function, Runtime} from "@aws-cdk/aws-lambda";
import {AttributeType, BillingMode, Table} from "@aws-cdk/aws-dynamodb";
import {
  CfnFunctionConfiguration,
  DynamoDbDataSource,
  GraphqlApi,
  LambdaDataSource,
  MappingTemplate, Resolver,
  Schema
} from "@aws-cdk/aws-appsync";

enum GraphQLType { QUERY = 'Query', MUTATION = 'Mutation' }

export class InfrastructureStack6 extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const articleName = 'Article';
    const commentName = 'Comment';

    /////////// DATABASE TABLES & ROLES ///////////

    const articleTable = new Table(this, articleName, {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {name: 'id', type: AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY // Note: Only for testing purposes!
    });

    const articlesTableRole = new Role(this, `${articleName}DynamoDBRole`, {
      assumedBy: new ServicePrincipal('appsync.amazonaws.com')
    });
    articlesTableRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));

    const commentTable = new Table(this, commentName, {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {name: 'articleId', type: AttributeType.STRING},
      sortKey: {name: 'createdAt', type: AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY // Note: Only for testing purposes!
    });

    const commentsTableRole = new Role(this, `${commentName}DynamoDBRole`, {
      assumedBy: new ServicePrincipal('appsync.amazonaws.com')
    });
    commentsTableRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));


    /////////// GRAPHQL API ///////////

    const blogsGraphQLApi = new GraphqlApi(this, 'BlogApi', {
      name: 'blog-api-6',
      schema: new Schema({ filePath: 'lib/schema_stack6.graphql' })
    });


    /////////// GRAPHQL DATA SOURCES ///////////

    const articleDataSource = new DynamoDbDataSource(this, 'articleDataSource', {
      api: blogsGraphQLApi,
      table: articleTable
    });

    const commentsDataSource = new DynamoDbDataSource(this, 'commentsDataSource', {
      api: blogsGraphQLApi,
      table: commentTable
    });


    /////////// GRAPHQL RESOLVERS ///////////

    new Resolver(this, 'storeArticlesResolver', {
      api: blogsGraphQLApi,
      dataSource: articleDataSource,
      fieldName: 'createArticle',
      typeName: GraphQLType.MUTATION,
      requestMappingTemplate: MappingTemplate.fromString(`{
        "version": "2017-02-28",
        "operation": "PutItem",
        "key": {
          "id": $util.dynamodb.toDynamoDBJson($util.autoId()),
          "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
        },
        "attributeValues" : $util.dynamodb.toMapValuesJson($ctx.args)
      }`),
      responseMappingTemplate: MappingTemplate.fromString(`$util.toJson($ctx.result)`)
    });

    new Resolver(this, 'queryArticlesResolver', {
      api: blogsGraphQLApi,
      dataSource: articleDataSource,
      fieldName: 'article',
      typeName: GraphQLType.QUERY,
      requestMappingTemplate: MappingTemplate.fromString(`{
        "version": "2017-02-28",
        "operation": "GetItem",
        "key": {
          "id": $util.dynamodb.toDynamoDBJson($ctx.args.id),
        }
      }`),
      responseMappingTemplate: MappingTemplate.fromString(`$util.toJson($ctx.result)`)
    });

    new Resolver(this, 'queryCommentsResolver', {
      api: blogsGraphQLApi,
      dataSource: commentsDataSource,
      fieldName: 'comments',
      typeName: articleName,
      requestMappingTemplate: MappingTemplate.fromString(`{
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
      }`),
      responseMappingTemplate: MappingTemplate.fromString(`{
        "nodes": $util.toJson($ctx.result.items),
        "nextToken": $util.toJson($util.defaultIfNullOrBlank($context.result.nextToken, null))
      }`)
    });


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

    const hasBadEmojisDataSource = new LambdaDataSource(this, 'hasBadEmojisDataSource', {
      api: blogsGraphQLApi,
      lambdaFunction: hasBadEmojisLambda,
      serviceRole: hasBadEmojisRole,
    });


    /////////// GRAPHQL FUNCTIONS ///////////

    const verifyArticleIdFunction = new CfnFunctionConfiguration(this, 'verifyArticleIdFunction', {
      apiId: blogsGraphQLApi.apiId,
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
    verifyArticleIdFunction.addDependsOn(articleDataSource.ds);

    const hasBadEmojisFunction = new CfnFunctionConfiguration(this, 'hasBadEmojisFunction', {
      apiId: blogsGraphQLApi.apiId,
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
    hasBadEmojisFunction.addDependsOn(hasBadEmojisDataSource.ds);

    const storeCommentsFunction = new CfnFunctionConfiguration(this, 'storeCommentsFunction', {
      apiId: blogsGraphQLApi.apiId,
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
    storeCommentsFunction.addDependsOn(commentsDataSource.ds);


    /////////// GRAPHQL PIPELINE RESOLVER ///////////

    new Resolver(this, 'createCommentsResolver', {
      api: blogsGraphQLApi,
      fieldName: 'createComment',
      typeName: GraphQLType.MUTATION,
      pipelineConfig: [verifyArticleIdFunction.attrFunctionId, hasBadEmojisFunction.attrFunctionId, storeCommentsFunction.attrFunctionId],
      requestMappingTemplate: MappingTemplate.fromString(`
      $util.qr($ctx.stash.put("articleId", $ctx.args.articleId))
      $util.qr($ctx.stash.put("content", $ctx.args.content))

      {}`),
      responseMappingTemplate: MappingTemplate.fromString(`$util.toJson($ctx.result)`)
    });
  }
}

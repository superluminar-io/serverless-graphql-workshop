import * as cdk from '@aws-cdk/core';
import {ManagedPolicy, Role, ServicePrincipal} from '@aws-cdk/aws-iam';
import {DynamoDbDataSource, GraphqlApi, MappingTemplate, Resolver, Schema} from "@aws-cdk/aws-appsync";
import {AttributeType, BillingMode, Table} from "@aws-cdk/aws-dynamodb";

enum GraphQLType { QUERY = 'Query', MUTATION = 'Mutation' }

export class InfrastructureStack1 extends cdk.Stack {
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
      name: 'blog-api-1',
      schema: new Schema({ filePath: 'lib/schema_stack1.graphql' })
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

    new Resolver(this, 'createCommentsResolver', {
      api: blogsGraphQLApi,
      dataSource: commentsDataSource,
      fieldName: 'createComment',
      typeName: GraphQLType.MUTATION,
      requestMappingTemplate: MappingTemplate.fromString(`{
        "version" : "2017-02-28",
        "operation" : "PutItem",
        "key" : {
          "articleId": $util.dynamodb.toDynamoDBJson($ctx.args.articleId),
          "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
        },
        "attributeValues" : {
          "id": $util.dynamodb.toDynamoDBJson($util.autoId()),
          "content": $util.dynamodb.toDynamoDBJson($ctx.args.content)
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
        }
      }`),
      responseMappingTemplate: MappingTemplate.fromString(`$utils.toJson($context.result.items)`)
    });
  }
}

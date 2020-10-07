# GraphQL API

## In this lab …

* Create the GraphQL schema
* Create resolvers for queries and mutations
* Use VTL to handle DynamoDB requests

## Mutation to create articles

The first mutation we are going to introduce gives us the ability to create new articles. Therefore we need to extend the schema, write a resolver and fire a DynamoDB request to persist the articles. 

1. Go back to the [AppSync console](console.aws.amazon.com/appsync) and select the API
2. In the sidebar, click on **Schema**. You should see this screen:
    ![AWS AppSync Console Schema](/_media/lab1/schema.png)
3. Replace the schema with the following schema:
    ```graphql
    type Article {
      id: ID!
      createdAt: AWSDateTime!
      title: String!
      content: String!
    }

    type Mutation {
      createArticle(title: String!, content: String!): Article!
    }

    type Query {
      hello: String!
    }

    schema {
      query: Query,
      mutation: Mutation
    }
    ```
4. Click on **Save schema**
5. On the right side, you should see all the types and fields we just defined in the schema. Scroll down a bit and find the `createArticle` mutation. Click on the **Atach** button next to the mutation:
    ![AWS AppSync Console Attach Resolver](/_media/lab1/attach.png)
6. Select **articles** as the Data source name
7. Replace the request mapping template:
    ```velocity
    {
        "version": "2017-02-28",
        "operation": "PutItem",
        "key": {
            "id": $util.dynamodb.toDynamoDBJson($util.autoId()),
            "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
        },
        "attributeValues" : $util.dynamodb.toMapValuesJson($ctx.args)
    }
    ```
8. And the response mapping template:
    ```velocity
    $util.toJson($ctx.result)
    ```
9. Click on **Save resolver**

Cool, we created the first mutation in the API and connected it with the DynamoDB table. It's time to do requests and test our API. AppSync has an interactive tool built-in to do GraphQL requests.

1. In the sidebar, click on **Queries**
2. Paste the following requests in the textarea:
    ```graphql
    mutation {
      createArticle(title: "Serverless GraphQL API with AppSync and DynamoDB", content: "In the last years, GraphQL has become very popular for frontend to backend communication in the tech industry. GraphQL makes it easy to control all the data you need and thanks to the typed schema GraphQL has great tooling for caching, testing, or orchestrating a microservice architecture. This workshop provides an outlook on the future of API development with Amazon Web Services. With just the AWS console and a small portion of code, we are able to create a serverless and scalable GraphQL API in minutes. If you love to play around with bleeding-edge technologies and want to get your hands dirty in a hands-on session - this workshop is the right one for you!") {
        id
        createdAt
        title
        content
      }
    }
    ```
3. Click on the play button above the textarea. AppSync executes the GraphQL request and prints out the answer of the server on the right side. You should see something like this:
  ![AWS AppSync Console Queries Mutation Response](/_media/lab1/mutation-response.png)
4. The first article got stored in the DynamoDB table. We can now go to [DynamoDB console](https://console.aws.amazon.com/dynamodb) and check the new entity. Ideally you see this:
  ![AWS DynamoDB Articles Table](/_media/lab1/dynamodb-article.png)

That's already pretty cool, but so far we can't retrieve articles in our API. Let's change this!

## Query to retrieve articles

1. Go back to the [AppSync console](console.aws.amazon.com/appsync), select the API and click on **Schema**
2. Replace the `Query` type by the following type:
  ```graphql
  type Query {
	  article(id: ID!): Article
  }
  ```
3. Click on **Save schema**
4. On the right side, scroll down to the `article(...): Article` query and click on **Attach**
5. For the data source, select **articles**
6. Replace the request mapping template:
    ```velocity
    {
        "version": "2017-02-28",
        "operation": "GetItem",
        "key": {
            "id": $util.dynamodb.toDynamoDBJson($ctx.args.id),
        }
    }
    ```
7. And the response mapping template:
    ```velocity
    $util.toJson($ctx.result)
    ```
8. Click on **Save resolver**
9. In the sidebar, click on **Queries**
10. Find out the ID of the article we just created (e.g. in the [DynamoDB console](https://console.aws.amazon.com/dynamodb)). After that, run the following query:
    ```graphql
    query {
      article(id: "<< YOUR ARTICLE ID >>") {
        id
        title
        content
        createdAt
      }
    } 
    ```
11. Tada, we can retrieve the article now in the GraphQL API!

## Mutation to create comments

This section is very similar to what we have done for the articles. Now we want to create a mutation to store comments.

1. Go back to the [AppSync console](console.aws.amazon.com/appsync) and select the API
2. In the sidebar, click on **Schema**.
3. Add the new type `Comment` and extend the `Mutation` type to support `createComment`: 
    ```graphql
    type Comment {
      id: ID!
      createdAt: String!
      content: String!
    }

    type Mutation {
      createArticle(title: String!, content: String!): Article!
      createComment(articleId: ID!, content: String!): Comment!
    }
    ```
4. Click on **Save schema**
5. On the right side, scroll down to the mutation `createComment(...): Comment!` and click on **Attach**
6. For the data source, select **comments**
7. Replace the request mapping template:
    ```velocity
    {
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
    }
    ```
8. And the response mapping template:
    ```velocity
    $util.toJson($ctx.result)
    ```
9. Click on **Save Resolver**
10. In the sidebar, click on **Queries**
11. Run the following mutation:
    ```graphql
    mutation {
      createComment(articleId: "<< YOUR ARTICLE ID >>", content: "Awesome!") {
        id
        createdAt
        content
      }
    }
    ```
12. With that, we created a comment and stored it in the DynamoDB table.

## Query to retrieve comments

1. Go back to the [AppSync console](console.aws.amazon.com/appsync), select the API and click on **Schema**
2. Extend the `Article` type with the `comments` field:
  ```graphql
  type Article {
    id: ID!
    createdAt: AWSDateTime!
    title: String!
    content: String!
    comments: [Comment!]!
  }
  ```
3. Click on **Save schema**
4. On the right side, scroll down to the `comments: [Comment!]!` field and click on **Attach**
5. For the data source, select **comments**
6. Replace the request mapping template:
    ```velocity
    {
        "version" : "2017-02-28",
        "operation" : "Query",
        "query": {
            "expression": "articleId = :articleId",
            "expressionValues" : {
                ":articleId" : $util.dynamodb.toDynamoDBJson($ctx.source.id)
            }
        }
    }
    ```
7. And the response mapping template:
    ```velocity
    $utils.toJson($context.result.items)
    ```
8. Click on **Save resolver**
9. In the sidebar, click on **Queries**
10. Run the following query:
    ```graphql
    query {
      article(id: "<< YOUR ARTICLE ID >>") {
        id
        title
        createdAt
        comments {
          id
          createdAt
          content
        }
      }
    }
    ```

After this lab, we are able to create and retrieve articles and write comments associated to the articles.
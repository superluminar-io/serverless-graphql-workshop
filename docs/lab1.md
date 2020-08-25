# Lab 1 - GraphQL API

## In this lab …

* Create the GraphQL schema
* Create resolvers for queries and mutations
* Use VTL to handle DynamoDB requests

## Mutation to create articles

The first mutation we are going to introduce gives us the ability to create new articles. Therefore we need to extend the schema, write a resolver and fire a DynamoDB request to persist the articles. 

1. Go back to the [AppSync console](console.aws.amazon.com/appsync) and select the API
2. In the sidebar, click on **Schema**. You should see this screen:
    ![AWS AppSync Console Schema](/_media/lab1/schema.png)
3. Replace the schema by the following schema:
    ```graphql
    type Article {
      id: ID!
      createdAt: AWSDateTime!
      title: String!
      content: String!
    }

    type Mutation {
      articleCreate(title: String!, content: String!): Article!
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
5. On the right side, you should see all the types and fields we just defined in the schema. Scroll down a bit and find the `articleCreate` mutation. Click on the **Atach** button next to the mutation:
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

Cool, we created the first mutation in the API and connected it with the database. It's time to do requests and test our API. AppSync has an interactive tool built-in to do GraphQL requests.

1. In the sidebar, click on **Queries**
2. Paste the following requests in the textarea:
    ```graphql
    mutation {
      articleCreate(title: "Serverless GraphQL API with AppSync and DynamoDB", content: "In the last years, GraphQL has become very popular for frontend to backend communication in the tech industry. GraphQL makes it easy to control all the data you need and thanks to the typed schema GraphQL has great tooling for caching, testing, or orchestrating a microservice architecture. This workshop provides an outlook on the future of API development with Amazon Web Services. With just the AWS console and a small portion of code, we are able to create a serverless and scalable GraphQL API in minutes. If you love to play around with bleeding-edge technologies and want to get your hands dirty in a hands-on session - this workshop is the right one for you!") {
        id
        createdAt
        title
        content
      }
    }
    ```
3. Click on the play button above the textarea. AppSync executes the GraphQL request and prints out the answer of the server on the right side. You should see something like this:
  ![AWS AppSync Console Queries Mutation Response](/_media/lab1/mutation-response.png)
4. The first article got stored in the DynamoDB database. We can now go to [DynamoDB console](https://console.aws.amazon.com/dynamodb) and check the new entity. Ideally you see this:
  ![AWS DynamoDB Articles Database](/_media/lab1/dynamodb-article.png)

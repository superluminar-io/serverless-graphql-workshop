# Pagination

## In this lab …

* Extends comments field to handle arguments
* Extend DynamoDB request to handle pagination

## Implementation

1. Go back to the [AppSync console](console.aws.amazon.com/appsync) and select the API
2. In the sidebar, click on **Schema**
3. Introduce the new type `CommentConnection` and extend the `Article` type to support the `limit` and `nextToken` arguments for comments:
    ```graphql
    type Article {
      id: ID!
      createdAt: AWSDateTime!
      title: String!
      content: String!
      comments(limit: Int, nextToken: String): CommentConnection!
    }

    type CommentConnection {
      nodes: [Comment!]!
      nextToken: String
    }
    ``` 
4. Click on **Save schema**
5. Find **comments(...): CommentConnection!** in the list of resolvers and click on **comments**
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
        },
        "limit": $util.defaultIfNull(${ctx.args.limit}, 20),
        "nextToken": $util.toJson($util.defaultIfNullOrBlank($ctx.args.nextToken, null))
    }
    ```
7. And the response mapping template:
    ```velocity
    {
        "nodes": $util.toJson($ctx.result.items),
        "nextToken": $util.toJson($util.defaultIfNullOrBlank($context.result.nextToken, null))
    }
    ```
8. Click on **Save resolver**

If you have more than two comments, then you should get back a `nextToken` as part of the response. You can use the `nextToken` to query the next chunk of comments. This is the easiest solution we can implement to support pagination.

## Exercise

We are now able to provide to arguments with the `comments` field: `limit` and `nextToken`.

* Make a query and limit the comments to return
* Make use of the `nextToken` to query the next page of comments
* How does a client determine, that there are no more comments to query?
* Is it recommended to implement pagination from the beginning?

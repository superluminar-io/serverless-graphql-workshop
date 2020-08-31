# Lab 2 - Pipeline

## In this lab …

* Create re-usable functions in AppSync
* Create an AppSync pipeline
* Use a Lambda function in AppSync

## Architecture

We want to build a pipeline for the `commentCreate` mutation to do validation before we actually store the comment. At first, we want to check if the provided article ID exists and then check the content for bad emojis we don't want to support. If the comment is valid, we want to store it.

## AppSync function

We create a function to store a comment. This is more or less the request/response mapping we already used for the `commentCreate` mutation.

1. Go back to the [AppSync console](console.aws.amazon.com/appsync) and select the API
2. In the sidebar, click on **Functions**
3. Click on **Create function** 
4. Select **comments** for data source
5. Use **storeComment** for **Function name**
6. Replace the request mapping template:
    ```velocity
    {
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
    }
    ```
7. And the response mapping template:
    ```velocity
    $util.toJson($ctx.result)
    ```
8. Click on **Create function**

In the next step, we are going to introduce a pipeline for the `commentCreate` mutation and use the function we just created.

## Mutation refactoring

1. Go back to the [AppSync console](console.aws.amazon.com/appsync) and select the API
2. In the sidebar, click on **Schema**
3. In the list of resolvers, scroll down to `commentCreate(...): Comment!`. Click on **comments**
4. Click on **Delete resolver**
5. Again, In the list of resolvers, scroll down to `commentCreate(...): Comment!`. Click on **Attach**
6. In the **Resolver for Mutation.commentCreate** section, click on **Convert to pipeline resolver**:
  ![AWS AppSync Convert To Pipeline](/_media/lab2/convert.png)
7. Now, in the **Functions** section, click on **Add function** and select **storeComment**
8. Open **Before mapping template** and replace it with:
    ```velocity
    $util.qr($ctx.stash.put("articleId", $ctx.args.articleId))
    $util.qr($ctx.stash.put("content", $ctx.args.content))

    {}
    ```
9. Click on **Create resolver**
10. In the sidebar, click on **Queries** and run this mutation:
    ```graphql
    mutation {
      commentCreate(articleId: "<< YOUR ARTICLE ID >>", content: "So cool!") {
        id
      }
    }
    ```

Great, we refactored the `commentCreate` mutation to use a pipeline. So far, the mutation does exactly the same, but we have prepared everything for valiation. Let's go to the next step!

## Article ID validation

With the pipeline in place, we can actually do cool stuff and validate the mutation. In the first step, we would like to check if the provided article ID exists.

1. Go back to the [AppSync console](console.aws.amazon.com/appsync) and select the API
2. In the sidebar, click on **Functions**
3. Click on **Create Function**
4. Select **articles** for data source
5. Use **isValidArticleId** for the function name
6. Replace the request mapping:
  ```velocity
  {
      "operation": "GetItem",
      "key": {
          "id": $util.dynamodb.toDynamoDBJson($ctx.stash.articleId),
      }
  }
  ```
7. And the response mapping:
  ```velocity
  #if($util.isNull($ctx.result))
      $util.error("Article ID is not valid!")
  #end

  {}
  ```
8. Click on **Create function**
9. In the sidebar, click on **Schema**. In the list of resolvers, scroll down to **commentCreate(...): Comment!** and click on **Pipeline**.
10. Click on **Add function** and select **isValidArticleId**
11. Select the **isValidArticleId** card and click on **Move up**. The **isValidArticleId** function should be now above the **storeComment** function.
12. Click on **Save resolver**
13. In the sidebar, click on **Queries** and run the following mutation again:
    ```graphql
    mutation {
      commentCreate(articleId: "<< YOUR ARTICLE ID >>", content: "So cool!") {
        id
      }
    }
    ```
14. It should still work. What happens if we run the mutation with an unknown article id?

This integration is already very cool. With the pipeline, we are able to communicate with two DynamoDB tables in just one GraphQL request. But, we can extend it even further and also add a Lambda function for more validation!

## Comment validation

We are going to write a simple Lambda function to validate the comment.

1. Go to the [Lambda console](https://console.aws.amazon.com/lambda)
2. Click on **Create function**
3. In the **Basic information** section, use **hasBadEmojis** for **Function name**
4. Keep everything else untouched and click on **Create function**
5. On the next page, scroll down a bit to the **Function code** section. Replace the code:
    ```javascript
    exports.handler = async ({ content }) => {
        const badEmojis = ['🖕', '💩'];
        
        let hasBadEmojis = false;
        badEmojis.forEach(badEmoji => {
            if (content.indexOf(badEmoji) !== -1) {
                hasBadEmojis = true;
            }
        })
        
        return { hasBadEmojis }
    };
    ```
6. Scroll up and click on **Save**
7. Go back to the [AppSync console](console.aws.amazon.com/appsync) and select the API
8. Click on **Data Sources**
9. Click on **Create data sources**
10. For data source, use **hasBadEmojis**
11. Select **AWS Lambda function** as **Data source type**
12. Choose the region you are currently using
13. For the function ARN, select the function including **hasBadEmojis**
14. Click on **Create**
15. In the sidebar, click on **Functions**
16. Click on **Create function**
17. Select **hasBadEmojis** for **Data source name**
18. Use **hasBadEmojis** as the function name
19. Replace the request mapping template:
    ```velocity
    {
        "operation": "Invoke",
        "payload": {
            "content": $util.toJson(${ctx.stash.content})
        }
    }
    ```
20. And the response mapping template:
    ```velocity
    #if($context.result.hasBadEmojis)
        $util.error("Content includes bad emojis :(")
    #end
    {}
    ```
21. Click on **Create function**
22. In the sidebar, click on **Schema**
23. In the list of resolvers, scroll down to `commentCreate(...): Comment!` and click on **Pipeline**
24. Click on **Add function** and select **hasBadEmojis**
25. Select the **hasBadEmojis** card
26. Click on **Move up** so the **hasBadEmojis** card is above the **storeComment** card
27. Scroll up and click on **Save resolver**

Cool, that's it! Time to play around with the mutation. Go back to the **Queries** explorer and run the following mutations:

```graphql
mutation {
  commentCreate(articleId: "<< YOUR ARTICLE ID >>", content: "So cool!") {
    id
  }
}
```

```graphql
mutation {
  commentCreate(articleId: "<< YOUR ARTICLE ID >>", content: "Not cool! 🖕") {
    id
  }
}
```

What do you get from the API?
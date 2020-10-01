# Lab 5 - Caching

## In this lab …

* Enable caching for AppSync
* Cache a single resolver
* Use and flush the cache

## Setup

1. Go back to the [AppSync console](console.aws.amazon.com/appsync) and select the API
2. In the sidebar, click on **Caching**
3. Select **Per-resolver caching**, scroll down and click on **Create cache**
4. In the sidebar, click on **Schema**
5. In the list of resolvers, scroll down to `comments: [Comment!]!` and click on **comments**
6. Scroll down and toggle **Enable caching**
7. Use **60** for **Cache time to live (TTL)**
8. Scroll up and click on **Save Resolver**

Perfect, we enabled caching for the API and configured the comments resolver to use the cache. We can now play around and understand how it behaves.

## Understand

1. In the sidebar, go to **Queries**
2. Run the following query:
    ```graphql
    query {
      article(id: "<< YOUR ARTICLE ID >>") {
        id
        title
        comments {
          id
          createdAt
          content
        }
      }
    }
    ```
3. We should see a list of comments, let's create a new comment for this article:
    ```graphql
    mutation {
      createComment(articleId: "<< YOUR ARTICLE ID >>", content: "Is it cached?") {
        id
      }
    }
    ```
4. Run the query again:
    ```graphql
    query {
      article(id: "<< YOUR ARTICLE ID >>") {
        id
        title
        comments {
          id
          createdAt
          content
        }
      }
    }
    ```
5. Do you see the new comment? Probably not because the request is cached. We can now flush the cache to immediately see the new comment. For that, click on **Caching** and then on **Flush cache**. Go back to **Queries** and run the query again. Do you see the comment now?

## Questions

* Is caching something I need to consider from the beginning?
* What are strategies to flush the cache in a real world example?

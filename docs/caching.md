# Caching

Caching is a great way to speed up an API, save money by not calling the underlying infrastructure and deal with quotas and limitations. AppSync comes with a built-in solution. In this section, we enable caching for the API and understand the behaviour by enabling it for a specific resolver. 

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

## Further notes

### Caching strategies

Caching is a powerful tool and it's good to see that AppSync provides a solution for that. However, we should use it with care. Firstly, AWS uses EC2 instances in the background to perform caching. That means we have to pay for the instances on an hourly plan (See [pricing](https://aws.amazon.com/appsync/pricing/)). Additionally, we need to think about caching invalidation, as described in the next section.

### Automated cache invalidation

In our example, we showcased the AppSync cache and how easy it is to set it up. However, for a production-ready API, we need to think about strategies to flush the cache automatically. One pragmatic solution would be to live with the TTL. If time matters and the API always has to return the latest set of data, then you need to flush the cache after executing a mutation. Flushing the cache could be an AppSync function you would just add to the AppSync pipeline of the mutation. Another, more asynchronous approach, would be a [DynamoDB stream](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html).
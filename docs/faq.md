# FAQ

## General

### Why GraphQL?

GraphQL became very popular for front-end to back-end communication because it creates a strict contract between the two layers, makes sure you only fetch the data you need, and offers a great developer experience thanks to the GraphQL schema.

To learn more about it, we recommend the [How to GraphQL](https://www.howtographql.com/) tutorial.

### How can I describe the infrastructure as code?

AWS provides a good [example](https://github.com/aws-samples/aws-cdk-examples/tree/master/typescript/appsync-graphql-dynamodb) to describe AppSync with the Cloud Development Kit (CDK).

---

## AppSync

### Which data sources can I use?

AppSync supports the following data sources: 

* DynamoDB
* ElasticSearch
* Lambda
* HTTP
* Relational database

It's worth mentioning that the **HTTP** integration is very powerful: We can use it to connect the GraphQL API with a legacy REST API or even connect the API with other AWS services (e.g. EventBridge). See [this tutorial](https://docs.aws.amazon.com/appsync/latest/devguide/tutorial-http-resolvers.html) for more details.

### Can I connect my legacy REST API with AppSync?

Yes, see the [HTTP integration](https://docs.aws.amazon.com/appsync/latest/devguide/tutorial-http-resolvers.html).

### How can I test VTL?

We recommend writing unit tests for the request and response mapping templates to shorten the feedback loop, otherwise we often need to apply the changes, go to the AWS console and check the integration. 

If you use NodeJS, [this NPM package](https://www.npmjs.com/package/appsync-template-tester) might be really interesting for you.

### How can I test the API?

Despite writing unit tests for the request and response mapping templates (see [How can I test VTL?](faq?id=how-can-i-test-vtl)), you should also consider some form of integration tests. The easiest way would be to fire some requests against your staging environment and define assertions before deploying the production environment.

### How to secure the API?

AWS AppSync provides many ways to secure a GraphQL API. See [this article](https://docs.aws.amazon.com/appsync/latest/devguide/security.html).

### How can I automate cache flushing?

In our example, we showcased the AppSync cache and how easy it is to set it up. However, for a production-ready API, we need to think about strategies to flush the cache automatically. One pragmatic solution would be to live with the TTL. If time matters and the API always has to return the latest set of data, then you need to flush the cache after executing a mutation. Flushing the cache could be an AppSync function you would just add to the AppSync pipeline of the mutation. Another, more asynchronous approach, would be a [DynamoDB stream](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html).

### I heard about Amplify. Is it the same?

No, Amplify uses AppSync under the hood to run GraphQL. [Amplify](https://aws.amazon.com/amplify/) is essentially a framework to develop web or mobile applications end-to-end. From hosting static assets, deploying the application, and persisting the data, Amplify tries to bundle everything you need to let you focus on the business logic. AppSync, on the other hand, is a service to build and maintain GraphQL APIs within the AWS ecosystem.

---

## DynamoDB

### Why DynamoDB?

DynamoDB is a NoSQL database deeply integrated into the AWS ecosystem. With DynamoDB we setup a GraphQL API with a persistence layer without maintaining a MySQL or PostgreSQL database, meaning no VPC setup, no maintenance in terms of updating the MySQL or PostgreSQL version or worrying about scaling. But, even if we see many benefits to use DynamoDB, relational databases might fit better in some use-cases, so it's up to you.

### Why not Single-Table Design?

The workshop focuses on building a GraphQL API with AWS services and uses DynamoDB to showcase the simplicity of connecting the API with a persistence layer. An in-depth focus on a production-ready DynamoDB schema was out of scope. However, we highly recommend [this article](https://www.alexdebrie.com/posts/dynamodb-single-table/#graphql--single-table-design) to get an overview of a single-table design and when to use it.

# Setup

## In this lab …

* Setup DynamoDB databases for the API
* Create the GraphQL API with AppSync
* Connect the DynamoDB databases with the GraphQL layer

## DynamoDB Setup

For our example project, we need to create two DynamoDB databases to store the entities **Article** and **Comment**. 

1. Go to the [DynamoDB console](https://console.aws.amazon.com/dynamodb)
2. Click on **Create table**
3. For **Table name** use **articles**
4. For **Partition key** use **id**
5. Keep everything else untouched and click on **Create**
6. Click again on the **Create table** button
7. Now, we use **comments** for the table name and **articleId** for the partition key
8. Tick the **Add sort key** checkbox and put **createdAt** in the input field
9. Again, keep everything else untouched and click on **Create**

Perfect, we created the tables and can continue to create the GraphQL API with AppSync.

## AppSync Setup

1. Go to the [AppSync console](https://console.aws.amazon.com/appsync/)
2. Click on **Create API**
3. In the section **Customize your API or import from Amazon DynamoDB**, select **Build from scratch**. Click on **Start**
4. On the next page, choose the API name (e.g. **Blog API**) and click on **Create**

That's it, we just created our GraphQL API. Before we can write our schema, we need to connect the GraphQL API with the DynamoDB databases.

## Data Sources

In order to use the DynamoDB databases as resources in the GraphQL API, we need to connect them in AppSync. Therefore we register the databases as data sources.

1. On the left side, you should see a sidebar. Click on **Data Sources**.
    ![AWS AppSync Console Data Sources](/_media/setup/data-sources.png)
2. Click on **Create data sources**
3. For **Data source name** use **articles**
4. Select **Amazon DynamoDB table** as the source type
5. For the region, select the one you are using right now (e.g. EU-CENTRAL-1)
6. In the next dropdown, you should see the databases we just created. Select **articles**.
7. Keep everything else untouched and click on **Create**

We now connected the **articles** database with the GraphQL API. We have to do the exact same steps for the **comments** database:

1. Click on **Create data sources**
2. For **Data source name** use **comments**
3. Select **Amazon DynamoDB table** as the source type
4. For the region, select the one you are using right now (e.g. EU-CENTRAL-1)
5. In the next dropdown, you should see the databases we just created. Select **comments**.
6. Keep everything else untouched and click on **Create**

Everything is prepared to write the first bit of the GraphQL API.

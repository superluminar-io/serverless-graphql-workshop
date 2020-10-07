# Authentication

## In this lab …

* Setup Cognito with default settings
* Create a Cognito user group plus a test user
* Use Cognito as an authentication mode in the API
* Use the Cognito group for authorization

## Architecture

*tbd*

## Setup

### Cognito

Before we can use Cognito in our API, we need to setup Cognito with a group and user. 

1. Go to the Cognito [console](https://console.aws.amazon.com/cognito/users).
2. Click on **Create a user pool**
3. For the pool name, use **Blog API**
4. Select **Review defaults**
5. We keep all default settings and just click on **Create pool**
6. On the left side, click on **Users and groups**
7. Click on the tab **Groups** and then on **Create group**
8. In the modal, use **Bloggers** for the name. Keep everything else empty and click on **Create group**
9. Click on the **Users** tab and then on **Create user**
10. For username, use a valid email address you have access to. (e.g. alice.wonderland@mycompany.com)
11. Untick **Send an invitation to this new user?**
12. For the temporary password use: `TestTest123.`
13. Untick **Mark phone number as verified?**
14. For email address, use the email address you just used for the username
15. Finally, click on **Create user**

So far, we created a user pool, a user group and a test user we are going to use to access the API. Before we can go back to AppSync, we also need to create an app client. AppSyncs needs it to communicate with Cognito. 

1. In the sidebar, click on **App clients**.
2. Click on **Add an app client**
3. For **App client name**, use **Blog API**
4. Untick **Generate client secret**
5. Keep everything else untouched and click on **Create app client**

That's it, we can go back to AppSync.

### AppSync 

1. Go back to the AppSync [console](https://console.aws.amazon.com/appsync/)
2. Select the **Blog API**
3. Click on **Settings**
4. Scroll down to **Default authorization mode** and change **API key** to **Amazon Cognito User Pool**
6. For the AWS region, choose the one you are using right now (e.g. eu-central-1)
7. In the next field, select the Cognito user pool we just created.
9. Scroll down and hit **Save**
10. In the sidebar, click on **Schema**
11. Go to the `createArticle` mutation and add a directive, it should look like this:
    ```graphql
    type Mutation {
	  createArticle(title: String!, content: String!): Article! @aws_auth(cognito_groups: ["Bloggers"])
	  createComment(articleId: ID!, content: String!): Comment!
    }
    ```
12. Click on **Save schema**

## Understand

Let's recap what we just did. We created a Cognito user pool and connected it with AppSync. Instead of using an API key, we now have to use the test user. 

1. In AppSync, go to the **Queries** section. 
2. Next to the play button should be a new **Login with User Pool** button. Click on the button.
3. In the modal, select the client id. Then use the email address of the test user for the username field and `TestTest123.` for the password.
4. Enter a new password for the test user, e.g. `TestTest456.`
5. You should be logged in. The button should change to **Logout**.
6. Great, let's perform a mutation:
    ```graphql
    mutation {
      createArticle(title: "Authentication with Cognito", content: "Does it work?") {
        id
        createdAt
        title
        content
      }
    }
    ```
7. The API should return something like `Not Authorized to access createArticle on type Mutation`. Why? Because in the schema we defined that only users in the **Bloggers** group are allowed to perform this mutation. So the test user has to be part of the group
8. We go back to [Cognito](console.aws.amazon.com/cognito/users) and select the **Blog API** pool
9. On the left side, click on **Users and groups**
10. Click on the user. In the new window, click on **Add to group**
11. Select the **Bloggers** group and hit **Add to group**. Close the modal and go back to AppSync
12. We need to logout and login the test user in the explorer. Click on the **Logout …** button and then again on **Login with User Pools**. Follow the instructions in the modal. 
13. Finally, click on the play button and you should see the result of the new article. The authorization works! 

## Further reading

* [Security documentation](https://docs.aws.amazon.com/appsync/latest/devguide/security.html)
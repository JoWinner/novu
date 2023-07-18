---
sidebar_position: 5
---

# Environments

Novu runs all your requests in the context of an environment. By default, Novu creates two environments when your account was just created, `development` and `production`.

## Development environment

The development environment is used for testing purposes and validating notification changes prior to committing them to the production environment.

## Production environment

It will be your live/production environment, you cannot make changes to this environment directly. You will first have to make the changes in the `development` environment and then promote it to `production`. This is a read-only environment.

## Data associated with environments

Novu will separate most of the data associated with your account based on the current accessed environment. This will include:

- Subscribers
- Workflows
- Messages
- Execution logs
- Connected integrations
- Notification feeds
- Brand related assets and settings

Each environment will be accessed using a separate credential set:

- **Application Identifier** - This is a public identifier used in client-side applications to identify your application.
- **API Secret Key** - A secret key used when communicating with the `Novu API` from your backend services.

We suggest configuring these key sets based on your active environment, the same as you would use to manage different service credentials and serve them based on the current environment in which your code is deployed.

## Promoting pending changes to production

After making a change to a workflow or brand relating settings, this change will be added under the [changes](https://web.novu.co/changes) page in the admin panel.
A change is generated by making a difference between the `development` environment and the target `production` environment. All pending changes will be listed on the [changes](https://web.novu.co/changes) page. A change can either be applied manually or by pressing the **Promote all changes** button.

![Changes Page](/img/platform/environments/changes.png)

:::info
Before pushing a change to production, make sure that the code associated with this change was pushed to production. This is specifically important when adding new variables to a workflow.
:::

## Important Links

- [Get Current Environment API](https://docs.novu.co/api/get-current-environment/)
- [Get API Keys API](https://docs.novu.co/api/get-api-keys/)
- [Regenerate API Keys API](https://docs.novu.co/api/regenerate-api-keys/)
# Circuit: A Social Network

This is a Next.js project built with Firebase, ShadCN UI, and Genkit.

## Getting Started Locally

To run the project on your machine, you'll first need to set up your Firebase project credentials.

1.  Create a file named `.env.local` in the root of the project.
2.  Add your Firebase configuration to this file. You can find these values in your Firebase project settings.

    ```bash
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
    ```

3.  Install dependencies and run the development server:

    ```bash
    npm install
    npm run dev
    ```

## Deploying to Firebase App Hosting

This project is configured for easy deployment to Firebase App Hosting.

### 1. Prerequisites

- **Install Firebase CLI:** If you haven't already, install it globally:
  `npm install -g firebase-tools`
- **Login to Firebase:**
  `firebase login`
- **Link Your Project:** Tell the CLI which Firebase project to use:
  `firebase use --add` (and select your project from the list)

### 2. Set Environment Variables in the Cloud

Your live application needs the same Firebase keys to connect to your database and authentication. The secure way to provide them is with Google Cloud's Secret Manager.

1.  Go to the [Secret Manager](https://console.cloud.google.com/security/secret-manager) page for your Firebase project.
2.  For **each** of the variables in your `.env.local` file (like `NEXT_PUBLIC_FIREBASE_API_KEY`), create a new secret. The secret's name must exactly match the variable name.
3.  After creating the secrets, you must give your App Hosting service account permission to access them. Find your App Hosting service account principal in the App Hosting settings in the Firebase console. It will look like `service-{PROJECT_NUMBER}@gcp-sa-apphosting.iam.gserviceaccount.com`.
4.  For each secret, grant the **Secret Manager Secret Accessor** role to that service account principal.

This step is crucial for your deployed app to function correctly.

### 3. Deploy

Once your secrets are configured, deploying is a single command:

```bash
firebase deploy
```

The Firebase CLI will handle building and deploying your Next.js application.

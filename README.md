# FlowBoard

**A real-time collaborative Kanban workspace built with Next.js and Appwrite.**

Plan work on shared boards, move cards between columns, and keep collaborators in sync as changes happen. FlowBoard includes board invitations, role-based permissions, and Google/GitHub sign-in.

[Live demo](https://flow-board-real-time-collaborative.vercel.app/) · [Source code](https://github.com/boykareal/Flow-board---Real-time-Collaborative-tool)

## What makes FlowBoard different

- **Live card updates:** Appwrite Realtime subscriptions deliver card creation, edits, moves, and deletions to everyone viewing the board.
- **Cross-column card transfer:** Drag a card between columns or reorder it within a column. The interface updates immediately; the server saves the new column and order, and the UI rolls back with an error if saving fails.
- **Permission-based collaboration:** Each board member has an owner, editor, or viewer role. The app checks permissions in its API routes as well as the interface.
- **Invitations and ownership transfer:** Owners invite people, manage member roles, remove members, and transfer board ownership. Invitation changes appear through realtime updates.
- **Google and GitHub authentication:** Sign in through Appwrite's OAuth providers.
- **Responsive dark interface:** Workspaces adapt to smaller screens and retain the app's dark visual theme.

## Roles

| Action | Owner | Editor | Viewer |
| --- | :---: | :---: | :---: |
| View board and cards | Yes | Yes | Yes |
| Create, edit, move, and delete cards | Yes | Yes | — |
| Add, rename, and delete columns | Yes | Yes | — |
| Invite people and manage membership | Yes | — | — |
| Change member roles or transfer ownership | Yes | — | — |

## Built with

- [Next.js](https://nextjs.org/) and React
- [Appwrite](https://appwrite.io/) for authentication, database, permissions, and Realtime
- [dnd-kit](https://dndkit.com/) for accessible drag-and-drop interactions
- Tailwind CSS for responsive styling

## Run locally

### Requirements

- Node.js 20 or newer
- An Appwrite project with a database and OAuth providers configured

### 1. Get the code and install dependencies

```bash
git clone https://github.com/boykareal/Flow-board---Real-time-Collaborative-tool.git
cd Flow-board---Real-time-Collaborative-tool
npm install
```

### 2. Configure Appwrite

In the Appwrite Console, create a project and add a **Web platform** for `localhost` and your deployed hostname. Enable Google and GitHub under **Auth → Settings → OAuth2 providers**. Create OAuth credentials with Google Cloud Console and GitHub, then enter the client IDs and secrets in the matching Appwrite provider settings. Use the callback URL shown by Appwrite when configuring each provider; FlowBoard completes sign-in at `/auth/callback`.

Create `.env.local` in the project root using this template:

```dotenv
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://<your-region>.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=<your-appwrite-project-id>
APPWRITE_API_KEY=<server-side-appwrite-api-key>
```

Create the Appwrite API key with the server-side permissions needed to manage the database and user profiles. Keep it private: `APPWRITE_API_KEY` is used by server code and must never be prefixed with `NEXT_PUBLIC_` or committed to Git.

### 3. Create the database collections

```bash
npm run setup:db
```

This creates or updates the FlowBoard database collections and profile search attributes. The database ID is `flow-board-project` and is defined in `src/models/name.js`.

### 4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app directs visitors to sign in before opening boards.

For a production build:

```bash
npm run build
npm start
```

## How realtime card moves work

When a collaborator drags a card, the browser optimistically updates the board and sends the changed card positions to the reorder API. The server verifies board membership and edit permission before saving. Appwrite then publishes document events, and other connected board clients reconcile their card lists from those events.

## Project structure

```text
src/
  app/boards/       Board list, creation, and collaborative board views
  app/api/          Authenticated board, card, column, profile, and invite APIs
  components/       Shared UI, authentication, and invitation components
  lib/              Appwrite client and server configuration
  models/           Appwrite database and collection setup
```

## Interview walkthrough

FlowBoard is a useful example of taking a collaborative interaction end to end: optimistic drag-and-drop in the client, server-side authorization and persistence, then realtime synchronization for other connected users. The role model is enforced at the API boundary, while the interface reflects the same permissions to prevent unavailable actions from being offered.

## License

See [LICENSE](LICENSE).

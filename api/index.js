import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import pkg from "@prisma/client";
import morgan from "morgan";
import cors from "cors";
import { auth } from "express-oauth2-jwt-bearer";

// this is a middleware that will validate the access token sent by the client
const requireAuth = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER,
  tokenSigningAlg: "RS256",
});

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// this is a public endpoint because it doesn't have the requireAuth middleware
app.get("/ping", (req, res) => {
  res.send("pong");
});

// add your endpoints below this line

// this endpoint is used by the client to verify the user status and to make sure the user is registered in our database once they signup with Auth0
// if not registered in our database we will create it.
// if the user is already registered we will return the user information
app.post("/verify-user", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const email = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/email`];
  const name = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/name`];

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  if (user) {
    res.json(user);
  } else {
    const newUser = await prisma.user.create({
      data: {
        email,
        auth0Id,
        name,
      },
    });

    res.json(newUser);
  }
});
//=============================================================================

// creates a journal
app.post("/journals", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;

  const { title, journalText } = req.body;

  if (!title || !journalText) {
    res.status(400).send("title and text is required");
  } else {
    const newItem = await prisma.journal.create({
      data: {
        title,
        journalText,
        creator: { connect: { auth0Id } },
        star: 0,
      },
    });
    //他好像会自动把这个journal加到用户的portfolio 里面
    res.status(201).json(newItem);
  }
});
//=============================================================================

// stars a journal
//这里使用post而不是put，说post是插入新内容，而put是替换元内容？
app.post("/journals/:journalId/star", requireAuth, async (req, res) => {
  const { journalId } = req.params;
  const auth0Id = req.auth.payload.sub;
  // Find the user based on Auth0 ID.
  //这是除了直接用auth0来connect以外的另一种方式：先找到user
  const user = await prisma.user.findUnique({
    where: { auth0Id },
  });
  // Add this journal to the user's starred list.
  //然后这个journal的staredbylist 也会自动加上这个user
  // await prisma.user.update({
  //   where: { id: user.id },
  //   data: {
  //     starredJournals: {
  //       connect: { id: parseInt(journalId) },
  //     },
  //   },
  // });
  //return res.send("Journal starred successfully.");
  const updatedJournal = await prisma.journal.update({
    where: { id: parseInt(journalId) },
    data: {
      star: { increment: 1 },
      starredBy: {
        connect: [{ id: user.id }], // Assuming you've resolved `user.id` from `auth0Id`
      },
    },
  });

  return res.json(updatedJournal);
});
//=============================================================================

//unstar a journal
app.post("/journals/:journalId/unstar", requireAuth, async (req, res) => {
  const { journalId } = req.params;
  const auth0Id = req.auth.payload.sub;
  //Find the user based on Auth0 ID.
  const user = await prisma.user.findUnique({
    where: { auth0Id },
  });
  // try to unstar the journal
  // await prisma.user.update({
  //   where: { id: parseInt(user.id) },
  //   data: {
  //     starredJournals: {
  //       disconnect: { id: parseInt(journalId) }, // 从收藏列表中移除journal
  //     },
  //   },
  // });
  // return res.send("Journal has been successfully unstarred.");
  const updatedJournal = await prisma.journal.update({
    where: { id: parseInt(journalId) },
    data: {
      star: { decrement: 1 },
      starredBy: {
        disconnect: [{ id: user.id }],
      },
    },
  });

  return res.json(updatedJournal);
});
//=============================================================================

//edit a journal
app.put("/journals/:journalId", requireAuth, async (req, res) => {
  const { journalId } = req.params;
  const { title, journalText } = req.body; // Assuming these are the fields you allow to be updated.
  const auth0Id = req.auth.payload.sub;
  //find the user based on Auth0 ID
  const user = await prisma.user.findUnique({
    where: { auth0Id },
  });
  if (!user) return res.status(404).send("User not found.");

  // Check if the journal belongs to the user.
  const journal = await prisma.journal.findUnique({
    where: { id: parseInt(journalId) },
  });
  if (!journal) return res.status(404).send("Journal not found.");
  if (journal.creatorId !== user.id)
    return res.status(403).send("Not authorized to edit this journal.");

  // Proceed with the update if the user is authorized.
  const updatedJournal = await prisma.journal.update({
    where: { id: parseInt(journalId) },
    data: { title, journalText },
  });

  return res.json(updatedJournal);
});
//=============================================================================

//delete a journal
app.delete("/journals/:journalId", requireAuth, async (req, res) => {
  const { journalId } = req.params;
  const auth0Id = req.auth.payload.sub; // Get the Auth0 ID of the authenticated user
  // First, verify the journal exists and that the authenticated user is the creator.
  const journal = await prisma.journal.findUnique({
    where: { id: parseInt(journalId) },
    include: { creator: true }, // Include the creator information
  });
  // Find the user based on Auth0 ID to ensure the operation is authorized
  const user = await prisma.user.findUnique({
    where: { auth0Id },
  });
  // If the user doesn't exist or isn't the creator, don't allow deletion
  if (!user || journal.creatorId !== user.id) {
    return res
      .status(403)
      .send("You're not authorized to delete this journal.");
  }
  // Proceed with deleting the journal
  //然后他也会自动从user的portfolio和starred list 里面把这个东西删掉
  await prisma.journal.delete({
    where: { id: parseInt(journalId) },
  });

  return res.send("Journal successfully deleted.");
});
//=============================================================================

//get a list of users
app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      // specify other fields i want to include
      // Be mindful of users' privacy
    },
  });
  res.json(users);
});
//=============================================================================

//get a list of journals(anonymous user)
app.get("/journals", async (req, res) => {
  try {
    const journals = await prisma.journal.findMany({
      select: {
        id: true,
        title: true,
        star: true,
        createdAt: true,
        creator: true,
        starredBy: true,
        // Add any other fields you need
      },
    });
    // If there are no journals, this will return an empty array
    res.json(journals);
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Failed to fetch journals:", error);

    // Respond with an error status code and message
    res
      .status(500)
      .json({ error: "An error occurred while fetching journals." });
  }
});

//=============================================================================

//get one journal
app.get("/journals/:journalId", async (req, res) => {
  const { journalId } = req.params;
  const journal = await prisma.journal.findUnique({
    where: { id: parseInt(journalId) },
    include: {
      starredBy: true, // Include the journal's starredBy list
      creator: true,
    },
  });

  if (journal) {
    res.json(journal);
  } else {
    res.status(404).send("Journal not found.");
  }
});

//=============================================================================

//get one user
app.get("/users/profile", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const user = await prisma.user.findUnique({
    where: { auth0Id },
    include: {
      starredJournals: true, // Include the user's starred journals
      createdJournals: true, // Include the user's created journals
    },
  });
  if (user) {
    res.json(user);
  } else {
    res.status(404).send("User not found.");
  }
});
const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => {
  console.log("Server running on http://localhost:8000 🎉 🚀");
});

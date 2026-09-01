"use client"
import { databases } from "@/lib/client/config";
import { cardsId, db } from "@/models/name";
import { ID } from "appwrite";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useState } from "react";

function Column({ title, cards, columnId, boardId, setCardsData, onrename , onDelete}) {
  const [isRenameOpen, setisRenameOpen] = useState(false);
  const [isAddcardOpen, setisAddcardOpen] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const cardTitle = formData.get("title");
    const description = formData.get("description");
    const dueDate = formData.get("dueDate");

    if (typeof cardTitle !== "string" || cardTitle.length < 6) {
      return;
    }

    try {
      const card = await databases.createDocument(db, cardsId, ID.unique(), {
        title: cardTitle,
        description: description || "",
        dueDate: dueDate || "",
        boardId,
        columnId,
        order: cards.length,
        labels: [],
        assigneeId: "",
      });

      setCardsData((prevCards) => [...prevCards, card]);

      setisAddcardOpen(false);

      e.currentTarget.reset();
    } catch (error) {
      console.error("Could not create card:", error);
    }
  };

  return (
    <div className="min-h-[300px] rounded-lg border p-4">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <button onClick={() => setisRenameOpen(true)}>Rename</button>

      <Dialog open={isRenameOpen} onOpenChange={setisRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Column</DialogTitle>
          </DialogHeader>
          <form onSubmit={onrename}>
            <div>
              <label htmlFor="newtitle">newTitle</label>
              <input
                className="text-black"
                id="newtitle"
                name="newtitle"
                placeholder="Enter New Title"
                type="text"
                required
                minLength={5}
              ></input>
            </div>
            <button type="submit">Rename column</button>
            <button type="button" onClick={() => setisRenameOpen(false)}>
              Cancel
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <button onClick={() => onDelete(columnId)}>delete Column </button>

      <div className="flex flex-col gap-3">
        {cards.map((card) => (
          <div key={card.$id}>{card.title}</div>
        ))}
      </div>

      <Dialog open={isAddcardOpen} onOpenChange={setisAddcardOpen}>
        <DialogTrigger>+ Add Card</DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Card</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="title">Title</label>
              <input
                className="text-black"
                id="title"
                name="title"
                placeholder="Title"
                type="text"
                required
              />
            </div>

            <div>
              <label htmlFor="description">Description</label>
              <input
                className="text-black"
                id="description"
                name="description"
                placeholder="Description (optional)"
                type="text"
              />
            </div>

            <div>
              <label htmlFor="dueDate">Due date</label>
              <input
                className="text-black"
                id="dueDate"
                name="dueDate"
                type="date"
              />
            </div>

            <DialogFooter>
              <button type="button" onClick={() => setisAddcardOpen(false)}>Cancel</button>
              <button type="submit">Create Card</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Column;

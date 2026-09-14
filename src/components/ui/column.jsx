"use client"
import { databases } from "@/lib/client/config";
import { cardsId, db } from "@/models/name";
import { ID } from "appwrite";
import {Card, CardContent} from "@/components/ui/card"
import {AlertDialog,AlertDialogTrigger,AlertDialogContent,AlertDialogHeader,AlertDialogDescription,AlertDialogAction, AlertDialogFooter, AlertDialogTitle} from "../ui/alert-dialog"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useState } from "react";
import { AlertDialog } from "@base-ui/react";

function Column({ title, cards, columnId, boardId, setCardsData, onrename , onDelete}) {
  const [selectedcard, setselectedcard] = useState(null);
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

      <AlertDialog>
        <AlertDialogTrigger>
          <button type="button">Delete Column</button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>

            <AlertDialogDescription>
              this will permanently delete this column
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={onDelete(columnId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <button onClick={() => onDelete(columnId)}>delete Column </button>

      <div className="flex flex-col gap-3">
        {cards.map((card) => (
          <Card
            key={card.$id}
            size="sm"
            className={
              "hover:bg-muted cursor-pointer flex-row items-center px-3 py-2"
            }
            onClick={() => setselectedcard(card)}
          >
            <CardContent className={"min-w-0 flex-1 px-0"}>
              <p className="truncate font-medium">{card.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={selectedcard !== null}
        onOpenChange={(open) => {
          if (!open) setselectedcard(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogHeader>{selectedcard?.title}</DialogHeader>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Description</h4>
              <p className="text-muted-foreground text-sm">
                {selectedcard?.description || "No description"}
              </p>
            </div>

            <div>
              <h4 className="font-medium">Labels</h4>
              <p>{selectedcard?.labeld?.join(", ") || "No labels"}</p>
            </div>

            <div>
              <h4 className="font-medium">Assignees</h4>
              <p>{selectedCard?.assignees?.join(", ") || "No assignees"}</p>
            </div>

            <div>
              <h4 className="font-medium">Due date</h4>
              <p>{selectedCard?.dueDate || "No due date"}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              <button type="button" onClick={() => setisAddcardOpen(false)}>
                Cancel
              </button>
              <button type="submit">Create Card</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Column;

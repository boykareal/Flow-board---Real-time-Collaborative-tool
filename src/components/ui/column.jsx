"use client"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { databases } from "@/lib/client/config";
import { cardsId, db } from "@/models/name";
import { ID } from "appwrite";
import {Card, CardContent} from "@/components/ui/card"
import {AlertDialog,AlertDialogTrigger,AlertDialogContent,AlertDialogHeader,AlertDialogDescription,AlertDialogAction, AlertDialogCancel, AlertDialogFooter, AlertDialogTitle} from "../ui/alert-dialog"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../ui/dialog";
import { useState } from "react";

function Column({ title, cards, columnId, boardId, setCardsData, onrename , onDelete}) {
  const [selectedcard, setselectedcard] = useState(null);
  const [Editing, setEditing] = useState(false);
  const [isRenameOpen, setisRenameOpen] = useState(false);
  const [isAddcardOpen, setisAddcardOpen] = useState(false);
  const [draftCard, setDraftCard] = useState(null);

const handleSubmit = async (e) => {
  e.preventDefault();

  // Capture the form before awaiting anything.
  const form = e.currentTarget;
  const formData = new FormData(form);

  const cardTitle = formData.get("title");
  const description = formData.get("description");
  const dueDate = formData.get("dueDate");

  if (
    typeof cardTitle !== "string" ||
    cardTitle.trim().length < 6
  ) {
    return;
  }

  try {
    const order = cards.length === 0 ? 0 : Math.max(...cards.map((card) => card.order)) + 1;

    const card = await databases.createDocument(
      db,
      cardsId,
      ID.unique(),
      {
        title: cardTitle.trim(),
        description:
          typeof description === "string" ? description : "",
        dueDate: typeof dueDate === "string" ? dueDate : "",
        boardId,
        columnId,
        order: order,
        labels: [],
        assigneeId: "",
      }
    );

    setCardsData((prevCards) => [...prevCards, card]);

    form.reset();
    setisAddcardOpen(false);
  } catch (error) {
    console.error("Could not create card:", error);
  }
}; // handleSubmit ends here.

function handleEdit() {
  if (!selectedcard) return;

  setDraftCard({
    ...selectedcard,
    labels: [...(selectedcard.labels ?? [])],
  });

  setEditing(true);
}

async function handleSave() {
  if (!draftCard) return;

  const title = draftCard.title.trim();

  if (title.length < 6) {
    alert("Title must contain at least 6 characters");
    return;
  }

  try {
    const updatedCard = await databases.updateDocument(
      db,
      cardsId,
      draftCard.$id,
      {
        title,
        description: draftCard.description,
        labels: draftCard.labels,
        assigneeId: draftCard.assigneeId,
        dueDate: draftCard.dueDate,
      }
    );

    setCardsData((previousCards) =>
      previousCards.map((card) =>
        card.$id === updatedCard.$id ? updatedCard : card
      )
    );

    setselectedcard(updatedCard);
    setDraftCard(updatedCard);
    setEditing(false);
  } catch (error) {
    console.error("Failed to update card:", error);
  }
};

  return (
    <div className="min-h-[320px] rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 text-zinc-100 shadow-lg shadow-black/10">
      <h2 className="mb-4 border-b border-zinc-800 pb-4 text-base font-semibold tracking-tight break-words">{title}</h2>
      <button className="mr-2 rounded-lg border border-zinc-700/70 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400" onClick={() => setisRenameOpen(true)}>Rename</button>

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
            <Button type="submit">Rename column</Button>
            <Button type="button" onClick={() => setisRenameOpen(false)}>
              Cancel
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog>
        <AlertDialogTrigger className="rounded-lg px-3 py-1.5 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400">Delete Column</AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>

            <AlertDialogDescription>
              this will permanently delete this column
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(columnId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <div className="my-4 flex flex-col gap-3">
        {cards.map((card) => (
          <Card
            key={card.$id}
            size="sm"
            className={
              "cursor-pointer flex-row items-center rounded-xl border border-zinc-700/60 bg-zinc-800/80 px-4 py-3 text-zinc-100 shadow-sm transition-colors hover:border-indigo-400/40 hover:bg-zinc-800"
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
          if (!open) {
            setselectedcard(null);
            setDraftCard(null);
            setEditing(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedcard?.title}</DialogTitle>
          </DialogHeader>

          {Editing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={draftCard.title}
                  onChange={(e) =>
                    setDraftCard({
                      ...draftCard,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={draftCard.description}
                  onChange={(e) =>
                    setDraftCard({
                      ...draftCard,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setDraftCard(null);
                  }}
                >
                  Cancel
                </Button>

                <Button type="button" onClick={handleSave}>
                  Save
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Description</h4>
                <p className="text-muted-foreground text-sm">
                  {selectedcard?.description || "No description"}
                </p>
              </div>

              <div>
                <h4 className="font-medium">Labels</h4>
                <p>{selectedcard?.labels?.join(", ") || "No labels"}</p>
              </div>

              <div>
                <h4 className="font-medium">Assignees</h4>
                <p>{selectedcard?.assigneeId?.join(", ") || "No assignees"}</p>
              </div>

              <div>
                <h4 className="font-medium">Due date</h4>
                <p>{selectedcard?.dueDate || "No due date"}</p>
              </div>
              <DialogFooter>
                <Button type="button" onClick={handleEdit}>
                  Edit
                </Button>

                <DialogClose asChild>
                  <button type="button" variant="outline">
                    Close
                  </button>
                </DialogClose>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddcardOpen} onOpenChange={setisAddcardOpen}>
        <DialogTrigger className="w-full rounded-xl border border-dashed border-zinc-700 px-4 py-3 text-left text-sm font-medium text-zinc-400 transition-colors hover:border-indigo-400/50 hover:bg-indigo-500/5 hover:text-indigo-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400">+ Add Card</DialogTrigger>

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
              <Button type="button" onClick={() => setisAddcardOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Card</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Column;

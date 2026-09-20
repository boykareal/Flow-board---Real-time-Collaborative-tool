"use client"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import axios from "axios";
import { useRouter } from "next/navigation";
import { withFreshJWT } from "@/lib/client/auth-request";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableCard({ card, canEdit, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: card.$id,
      data: {
        type: "card",
        columnId: card.columnId,
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        size="sm"
        className="cursor-pointer flex-row items-center rounded-xl border border-zinc-700/60 bg-zinc-800/80 px-4 py-3 text-zinc-100 shadow-sm transition-colors hover:border-indigo-400/40 hover:bg-zinc-800"
        {...attributes}
        {...(canEdit ? listeners : {})}
        onClick={onClick}
      >
        <CardContent className="min-w-0 flex-1 px-0">
          <p className="truncate font-medium">{card.title}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Column({ title, cards, columnId, boardId, setCardsData, onrename , onDelete, canEdit}) {
  const { setNodeRef: setColumnDropRef } = useDroppable({
    id: `column-${columnId}`,
    data: { type: "column", columnId },
  });
  const [selectedcard, setselectedcard] = useState(null);
  const [Editing, setEditing] = useState(false);
  const [isRenameOpen, setisRenameOpen] = useState(false);
  const [isAddcardOpen, setisAddcardOpen] = useState(false);
  const [draftCard, setDraftCard] = useState(null);
  const [error,seterror] = useState(null);
  const [cardError, setCardError] = useState(null);
  const router = useRouter();

const handleSubmit = async (e) => {
  e.preventDefault();
  setCardError(null);

  const form = e.currentTarget;
  const formData = new FormData(form);

  const cardTitle = formData.get("title");
  if (typeof cardTitle !== "string" || cardTitle.trim().length < 6) {
    setCardError("Card title must contain at least 6 characters.");
    return;
  }

  formData.set("title", cardTitle.trim());
  formData.append("columnId", columnId);


  try {
    const response = await withFreshJWT(
      (token) =>
        axios.post("/api/cards/create", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      () => router.replace("/login"),
    );

    const createdCard = response.data.card;

    setCardsData((prevCards) => [...prevCards, createdCard]);
    form.reset();
    setisAddcardOpen(false);
  } catch (error) {
    console.error("Could not create card:", error);

    if (axios.isAxiosError(error)) {
      setCardError(
        error.response?.data?.error ??
          "Unable to create card. Please try again.",
      );
    } else {
      setCardError("Something went wrong. Please try again.");
    }
  }
};

function handleEdit() {
   if (!canEdit) {
     seterror("Only owners and editors can edit cards.");
     return;
   }

  if (!selectedcard) return;

  setDraftCard({
    ...selectedcard,
    labels: [...(selectedcard.labels ?? [])],
  });

  setEditing(true);
}

async function handleSave() {
  if (!draftCard) return;

   try {
     const response = await withFreshJWT(
       (token) =>
         axios.patch(
           `/api/cards/${selectedcard.$id}`,
           {
             title: draftCard.title,
             description: draftCard.description,
             assigneeId: draftCard.assigneeId,
           },
           {
             headers: {
               Authorization: `Bearer ${token}`,
             },
           },
         ),
       () => router.replace("/login"),
     );

     const updatedCard = response.data;

     setCardsData((prev) => prev.map((card)=> card.$id === updatedCard.$id ? updatedCard : card))
     setselectedcard(updatedCard);
     setEditing(false);
   } catch (error) {
     console.error("Failed to update card:", error);

     if (axios.isAxiosError(error)) {
       seterror(
         error.response?.data?.error ??
           "Unable to update card. Please try again.",
       );
     } else {
       seterror("Something went wrong. Please try again.");
     }
   }
};

async function handleDeleteCard() {
  if (!selectedcard || !canEdit) {
    seterror("Only owners and editors can delete cards.");
    return;
  }

  try {
    await withFreshJWT(
      (token) =>
        axios.delete(`/api/cards/${selectedcard.$id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      () => router.replace("/login"),
    );

    setCardsData((previousCards) =>
      previousCards.filter((card) => card.$id !== selectedcard.$id),
    );
    setselectedcard(null);
    setDraftCard(null);
    setEditing(false);
  } catch (error) {
    console.error("Failed to delete card:", error);
    seterror(
      axios.isAxiosError(error)
        ? error.response?.data?.error ?? "Unable to delete card."
        : "Unable to delete card.",
    );
  }
}

  return (
    <div className="min-h-[320px] rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 text-zinc-100 shadow-lg shadow-black/10">
      <h2 className="mb-4 border-b border-zinc-800 pb-4 text-base font-semibold tracking-tight break-words">
        {title}
      </h2>
      <button
        className="mr-2 rounded-lg border border-zinc-700/70 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
        onClick={() => setisRenameOpen(true)}
      >
        Rename
      </button>

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

      {canEdit && <AlertDialog>
        <AlertDialogTrigger className="rounded-lg px-3 py-1.5 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400">
          Delete Column
        </AlertDialogTrigger>

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
      </AlertDialog>}

      <div
        ref={setColumnDropRef}
        className="my-4 flex min-h-24 flex-col gap-3"
      >
        <SortableContext
          items={cards.map((card) => card.$id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <SortableCard
              key={card.$id}
              card={card}
              canEdit={canEdit}
              onClick={() => setselectedcard(card)}
            />
          ))}
        </SortableContext>
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
                <p>{selectedcard?.assigneeId || "No assignees"}</p>
              </div>

              <div>
                <h4 className="font-medium">Due date</h4>
                <p>{selectedcard?.duedate || "No due date"}</p>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <DialogFooter>
                <Button type="button" onClick={handleEdit}>
                  Edit
                </Button>

                {canEdit && (
                  <AlertDialog>
                    <AlertDialogTrigger className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700">
                      Delete
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this card?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCard}>
                          Delete card
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <DialogClose>Close</DialogClose>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddcardOpen}
        onOpenChange={(open) => {
          setisAddcardOpen(open);
          if (open) setCardError(null);
        }}
      >
        <DialogTrigger className="w-full rounded-xl border border-dashed border-zinc-700 px-4 py-3 text-left text-sm font-medium text-zinc-400 transition-colors hover:border-indigo-400/50 hover:bg-indigo-500/5 hover:text-indigo-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400">
          + Add Card
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Card</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="title">Title</Label>
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
              <Label htmlFor="description">Description</Label>
              <input
                className="text-black"
                id="description"
                name="description"
                placeholder="Description (optional)"
                type="text"
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Due date</Label>
              <input
                className="text-black"
                id="dueDate"
                name="dueDate"
                type="date"
              />
            </div>

            <div>
              <Label htmlFor="assigneeId">assigneeId</Label>
              <input
                className="text-black"
                id="assigneeId"
                name="assigneeId"
                placeholder="Enter Id"
                type="text"
              />
            </div>

            <div>
              <Label htmlFor="attachments">attachments</Label>
              <input
                type="file"
                name="attachments"
                multiple
                accept="image/*,.pdf,.docx"
              />
            </div>

            {cardError && (
              <p role="alert" className="text-sm text-red-400">
                {cardError}
              </p>
            )}

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

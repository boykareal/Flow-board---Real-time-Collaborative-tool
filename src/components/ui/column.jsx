function Column({ title,cards,columnId}) {
  return (
    <div className="min-h-[300px] rounded-lg border p-4">
      <h2 className="mb-4 font-semibold">{title}</h2>

      <div className="flex flex-col gap-3">{cards.map((card) => (
        <div key={card.$id}>
        {card.title}
        </div>
      ))}
      </div>
      
      <button>
        + Add Card
      </button>
    </div>
  );
}

export default Column;

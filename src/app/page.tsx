export default async function Home() {
  return (
    <main className="p-4 max-w-md mx-auto">
      <header className="sticky top-0 bg-background pt-2 pb-3 z-10">
        <div className="text-xl font-semibold">Yachtdrop</div>
        <div className="text-sm text-muted-foreground">
          Quick marine supplies — app-style
        </div>
      </header>

      <div className="mt-4 text-sm text-muted-foreground">
        Next step: prikaz kartica iz /api/products + quick add.
      </div>
    </main>
  );
}

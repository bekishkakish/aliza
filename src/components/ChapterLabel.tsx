export default function ChapterLabel({
  number,
  children,
}: {
  number: string;
  children: React.ReactNode;
}) {
  return (
    <div className="chapter-label">
      <span className="red-tick" />
      <span>ГЛАВА {number}</span>
      <span className="label-rule" />
      <span>{children}</span>
    </div>
  );
}

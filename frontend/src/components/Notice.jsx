export default function Notice({ creator, postedAt, body }) {
  return (
    <>
      <ul>
        <li>Creator name: {creator}</li>
        <li>Posted at: {postedAt}</li>
      </ul>
      <p>{body}</p>
    </>
  );
}

import React from "react";

import Notice from "./Notice";

export default function Board() {
  const [noticesState, setNoticesState] = React.useState({
    noticesCount: 0,
    notices: [],
  });
  React.useEffect(() => {
    fetch("notices")
      .then((response) => response.json())
      .then((data) => {
        const noticesCount = data.notices_count;
        const notices = data.notices;
        setNoticesState({
          noticesCount: noticesCount,
          notices: notices,
        });
      })
      .catch((error) => console.log(error));
  }, []);
  return (
    <>
      {noticesState.notices.map((notice) => (
        <Notice
          key={notice.id}
          creator={notice.creator_name}
          postedAt={notice.posted_at}
          body={notice.body}
        />
      ))}
    </>
  );
}

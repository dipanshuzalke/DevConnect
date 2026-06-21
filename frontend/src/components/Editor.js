import React, { useEffect, useRef } from "react";
import CodeMirror from "codemirror";

import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";

import { ACTIONS } from "../Actions";

function Editor({ socketRef, roomId, onCodeChange }) {
  const editorRef = useRef(null);
  const onCodeChangeRef = useRef(onCodeChange);

  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
  }, [onCodeChange]);

  // Create editor only once
  useEffect(() => {
    editorRef.current = CodeMirror.fromTextArea(
      document.getElementById("realtimeEditor"),
      {
        mode: { name: "javascript", json: true },
        theme: "dracula",
        autoCloseTags: true,
        autoCloseBrackets: true,
        lineNumbers: true,
      }
    );

    editorRef.current.setSize(null, "100%");

    const handleChange = (instance, changes) => {
      const { origin } = changes;
      const code = instance.getValue();

      onCodeChangeRef.current(code);

      if (origin !== "setValue") {
        socketRef.current?.emit(ACTIONS.CODE_CHANGE, {
          roomId,
          code,
        });
      }
    };

    editorRef.current.on("change", handleChange);

    return () => {
      editorRef.current?.off("change", handleChange);
      editorRef.current?.toTextArea();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Register socket listener whenever socket becomes available
  useEffect(() => {
    const socket = socketRef.current;

    if (!socket) return;

    const handleIncomingCode = ({ code }) => {
      if (
        code !== null &&
        editorRef.current &&
        code !== editorRef.current.getValue()
      ) {
        editorRef.current.setValue(code);
      }
    };

    socket.on(ACTIONS.CODE_CHANGE, handleIncomingCode);

    return () => {
      socket.off(ACTIONS.CODE_CHANGE, handleIncomingCode);
    };
  });

  return (
    <div style={{ height: "600px" }}>
      <textarea id="realtimeEditor" />
    </div>
  );
}

export default Editor;
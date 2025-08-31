"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ChangeEvent, Dispatch } from "react";
import {
  Loader2,
  Send,
  Brain,
  ImageIcon,
  FileText,
  Presentation,
  Map,
  Radio,
  Search,
  LucideIcon,
  BrainCircuit,
} from "lucide-react";
import { FormEvent, KeyboardEvent, useRef, useEffect, useState } from "react";
import { StopCircle } from "lucide-react";
import { SetStateAction } from "react";

type AttachmentType = "image" | "pdf" | "ppt" | null;
export type outputType = "roadmap" | "illustration" | "mindmap" | null;

type output = {
  outputId: outputType;
  label: string;
  Icon: LucideIcon;
};

const OutputTypes: output[] = [
  {
    outputId: "roadmap",
    label: "Roadmap",
    Icon: Map,
  },
  {
    outputId: "mindmap",
    label: "Mindmap",
    Icon: BrainCircuit,
  },
];

function OutputButton({
  output,
  selectedOutput,
  loading,
  setSelectedOutput,
}: {
  output: output;
  selectedOutput: outputType;
  loading: boolean;
  setSelectedOutput: React.Dispatch<React.SetStateAction<outputType | null>>;
}) {
  return (
    <Button
      type="button"
      variant={"outline"}
      disabled={loading}
      className={`dark:bg-transparent rounded-full transition-colors ${
        selectedOutput === output.outputId
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
          : ""
      }`}
      onClick={() =>
        setSelectedOutput((prev) =>
          prev === output.outputId ? null : output.outputId
        )
      }
    >
      <output.Icon
        className={selectedOutput === output.outputId ? "text-blue-500" : ""}
      />
      <span
        className={`ml-1 ${
          selectedOutput === output.outputId
            ? "text-blue-600 dark:text-blue-400"
            : ""
        }`}
      >
        {output.label}
      </span>
    </Button>
  );
}
const ChatInput2 = (props: {
  handleSubmit: (e: FormEvent) => void;
  loading: boolean;
  input: string;
  selectedOuput: outputType;
  setSelectedOuput: Dispatch<SetStateAction<outputType>>;
  // isStreaming: boolean;
  // setIsStreaming: React.Dispatch<SetStateAction<boolean>>;
  setInput: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  stop: () => void;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedAttachment, setSelectedAttachment] =
    useState<AttachmentType>(null);
  // const [selectedOuput, setSelectedOuput] = useState<outputType | null>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement === document.body) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };

    document.addEventListener(
      "keydown",
      handleGlobalKeyDown as unknown as EventListener
    );
    return () => {
      document.removeEventListener(
        "keydown",
        handleGlobalKeyDown as unknown as EventListener
      );
    };
  }, []);
  return (
    <form
      onSubmit={props.handleSubmit}
      className="relative w-full max-w-3xl flex flex-col justify-end"
    >
      {props.loading && (
        <div className="text-[0.98rem] text-gray-500 top-[-1.5rem] pl-[0.7rem] z-[10] overflow-visible">
          Thinking...
        </div>
      )}
      <div className="relative pb-[0.5rem] flex flex-row gap-2">
        {OutputTypes.map((item) => (
          <OutputButton
            key={item.outputId}
            output={item}
            selectedOutput={props.selectedOuput}
            setSelectedOutput={props.setSelectedOuput}
            loading={props.loading}
          />
        ))}
      </div>
      <div className="w-full max-w-3xl flex flex-col relative overflow-hidden rounded-t-[1.2rem] border-1 gap-0 space-y-0">
        <Textarea
          ref={textareaRef}
          value={props.input}
          onChange={props.setInput}
          className="relative g-neutral-950 flex-1 rounded !min-h-[5.4rem] max-h-[36vh] resize-none rounded-b-[0] rounded-t-[1.2rem] p-[0.8rem] !pr-[6rem] !mb-4rem] !text-[1.05rem] !border-0 shadow-none  focus-visible:ring-0"
          placeholder="Enter what you want to Learn…"
          autoFocus
          onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter") {
              if (e.shiftKey) {
                return;
              } else if (!props.loading && props.input.trim()) {
                e.preventDefault();
                props.handleSubmit(e as unknown as FormEvent);
              } else {
                e.preventDefault();
              }
            }
          }}
        />
        {props.loading && (
          <Button
            onClick={() => {
              props.stop();
            }}
            className="absolute z-[9999] bottom-[0.8rem] left-[50%] transform translate-x-[-50%]"
          >
            <StopCircle />
            Cancel
          </Button>
        )}
        <div className="absolute top-[0.4rem] right-[0.4rem] flex flex-row gap-[0.2rem]">
          <Button
            type="submit"
            variant={"outline"}
            disabled={props.loading}
            className="absolut w-[3.4rem] h-[3.4rem] rounded-[1rem]  "
          >
            {props.loading ? (
              <Loader2 className="animate-spin !h-[1.2rem] !w-auto" />
            ) : (
              <Send className="!h-[1.4rem] !w-auto" />
            )}
          </Button>
        </div>

        <div className=" w-full flex justify-between items-center relative left-0 bottom-0 p-4  dark:bg-input/30 ">
          <div>
            <Button
              type="button"
              variant={"outline"}
              disabled={props.loading}
              className="dark:bg-transparent rounded-full"
            >
              <Search />
              Search
            </Button>
            {/* <Toggle
              pressed={props.isStreaming}
              onPressedChange={props.setIsStreaming}
              type="button"
              variant={"outline"}
              disabled={props.loading}
              className="dark:bg-transparent rounded-full px-3"
            >
              <Radio />
              Stream
            </Toggle> */}
          </div>

          <Toggle
            className="absolute w-[3rem] h-[3rem] rounded-[1rem] bottom-[0.7rem] right-[0.6rem] border-0 "
            disabled={props.loading}
          >
            <Brain className="!h-[1.4rem] !w-auto" />
          </Toggle>
        </div>
      </div>
    </form>
  );
};

export { ChatInput2 };

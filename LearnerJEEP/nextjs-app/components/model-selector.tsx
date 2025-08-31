"use client";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { useChatStatus } from "@/hooks/useChatStatus";

import { Model } from "@/lib/types";


export const ModelSelector = ({className, status}: {className?: string, status?: boolean}) => {
    // const { open } = useSidebar();
    // const { status: chatStatus } = useChatStatus();
    // const a = localStorage.getItem("chatModel");
    const [currentModel, setCurrentModel] = useState("");
    useEffect(() => {
        // localStorage.setItem("chatModel", "mistral-7b-instruct-v0.3");
        const Mvalue = localStorage.getItem("chatModel");
        setCurrentModel(Mvalue || "mistral-7b-instruct-v0.3");
      }, []);
      const valueChange = (value: string) => {
        localStorage.setItem("chatModel", value);
        setCurrentModel(value);
      };
      // Handle model change here
      const [models, setModels] = useState<Model[]>([]);
      const [loading, setLoading] = useState(true);
      useEffect(() => {
        const fetchModels = async () => {
          try {
            const response = await fetch("/api/model"); // Ensure this endpoint returns models
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setModels(data.output); // use `data.output.data` based on your route file
          } catch (error) {
            console.error("Error fetching models:", error);
          } finally {
            setLoading(false);
          }
        };
    
        fetchModels();
      }, []);
    return (
        <div className={className}>
        <Select
        
        defaultValue={currentModel}
        onValueChange={valueChange}
        disabled={loading || status}
      >
        <SelectTrigger className="w-[180px] focus-visible:ring-0 focus-visible:outline-0 ">
          <SelectValue placeholder={currentModel} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>AI Models</SelectLabel>

            {models?.map((model, i) => (
              <SelectItem key={i} value={model.id}>
                {model.id.replace("-", " ")}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select></div>);
      }
import { useEffect, useRef } from "react";
import { useIsFocused } from "@react-navigation/native";
import { screen } from "./segment";

type Props = Partial<{
  [key: string]: any;
}> & {
  category: string;
  name?: string;
  sensitive?: boolean;
};

export default function TrackScreen({
  category,
  name,
  sensitive = false,
  ...props
}: Props) {
  const isFocused = useIsFocused();
  const isFocusedRef = useRef<boolean>();

  useEffect(() => {
    if (isFocusedRef.current !== isFocused) {
      isFocusedRef.current = isFocused;

      if (isFocusedRef.current) {
        screen(category, name, props, sensitive);
      }
    }
  }, [category, name, props, isFocused, sensitive]);

  return null;
}

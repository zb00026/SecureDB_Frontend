import { Button, ButtonProps } from "@chakra-ui/react";
import { useNavigate } from "react-router";

export type DamButtonPropsType = {
  link?: string;
  to?: string;
  onClick?: () => void;
} & ButtonProps;

export function DamButton({
  children,
  link,
  to,
  onClick,
  ...rest
}: DamButtonPropsType) {
  const navigate = useNavigate();

  const onButtonClick = () => {
    if (link) {
      navigate(link);
    } else if (to) {
      console.log(to);
    } else if (onClick) {
      onClick();
    }
  };
  return (
    <Button onClick={onButtonClick} {...rest}>
      {children}
    </Button>
  );
}

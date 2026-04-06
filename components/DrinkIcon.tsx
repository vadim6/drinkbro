export function DrinkIcon({
  icon,
  emojiClassName = "",
  imgClassName = "",
}: {
  icon: string;
  emojiClassName?: string;
  imgClassName?: string;
}) {
  if (icon.startsWith("/")) {
    return <img src={icon} alt="" className={imgClassName} />;
  }
  return <span className={emojiClassName}>{icon}</span>;
}

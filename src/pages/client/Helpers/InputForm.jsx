export default function InputForm({
  label,
  type = "text",
  name,
  placeholder,
  children,
  inputHandler,
  value,
  inputClasses = "",
  labelClasses = "text-qgray text-[13px] font-normal",
}) {
  return (
    <div className="input-com w-full h-full">
      {label && (
        <label
          htmlFor={name}
          className={`input-label capitalize block mb-2 ${labelClasses}`}
        >
          {label}
        </label>
      )}
<div
  className={`input-wrapper border border-qgray-border w-full h-full overflow-hidden relative rounded-[10px]`}
>
<input
  id={name}
  name={name}
  type={type}
  placeholder={placeholder}
  value={value}
  onChange={inputHandler}
  className={`input-field placeholder:text-sm text-sm px-6 py-3 text-dark-gray w-full font-normal bg-white focus:ring-0 focus:outline-none ${inputClasses}`}
/>

  {children}
</div>

    </div>
  );
}
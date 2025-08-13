export default function InputFaq({
  label,
  type = "text",
  name,
  placeholder,
  value,
  onChange, 
  inputClasses = "",
  labelClasses = "text-qgray text-[13px] font-normal",
}) {
  return (
    <div className="w-full h-full">
      {label && (
        <h6 className={`input-label capitalize block mb-2 ${labelClasses}`}>
          {label}
        </h6>
      )}
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange} 
        className={`w-full ${inputClasses} placeholder:text-sm text-sm px-6 text-dark-gray font-normal bg-white border border-qgray-border focus:ring-0 focus:outline-none`}
      />
    </div>
  );
}

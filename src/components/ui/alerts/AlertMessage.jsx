function AlertMessage({ type, children }) {
  const baseClasses = "mt-4 p-3 rounded-md text-sm text-center";
  const styles = {
    success: "bg-green-50 border border-green-200 text-green-700",
    error: "bg-red-50 border border-red-200 text-red-700",
    info: "bg-blue-50 border border-blue-200 text-blue-700",
  };

  return <div className={`${baseClasses} ${styles[type]}`}>{children}</div>;
}

export default AlertMessage;

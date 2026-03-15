export const generateInvoiceNumber = () => {
  const prefix = "INV";
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000); // 4 digit random
  return `${prefix}-${datePart}-${randomPart}`;
};
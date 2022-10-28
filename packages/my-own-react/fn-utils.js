
export const tapFn = (fnName, fn) => (...args) => {
  try {
    console.log(`Function ${fnName} called with arguments ${args}`);
  } catch (error) {
    console.log(`could not serialize arguments for call to ${fnName}`, error);
  }
  const result = fn(...args);
  try {
    console.log(`Function ${fnName} returning ${result}`);
  } catch (error) {
    console.log(`Could not serialize return type for ${fnName}`, error);
  }
  return result;
};

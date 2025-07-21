// Enhanced version with error handling
async function calculate(a, b) {
  try {
    // Validate inputs
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Both parameters must be numbers');
    }
    
    // Simulate async operation
    const result = await Promise.resolve(a + b);
    
    console.log(`Calculated: ${a} + ${b} = ${result}`);
    return result;
  } catch (error) {
    console.error('Calculation failed:', error);
    throw error;
  }
}
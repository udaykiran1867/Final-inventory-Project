
import { supabase } from '../config/supabase.js';
import { generatePDF } from '../utils/generatePDF.js';

export const downloadPDF = async (req, res) => {
  const { month } = req.query;

  const { data } = await supabase
    .from('inventory_logs')
    .select('*')
    .gte('created_at', `${month}-01`)
    .lte('created_at', `${month}-31`);

  generatePDF(data, res, month);
};

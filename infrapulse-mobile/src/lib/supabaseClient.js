import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://your-project-url.supabase.co'; // Replace with actual URL
const SUPABASE_ANON_KEY = 'your-anon-key'; // Replace with actual Key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

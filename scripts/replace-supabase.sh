#!/bin/bash
# Script to help identify Supabase usage in frontend files

echo "Files with Supabase imports:"
find app -name "*.tsx" -o -name "*.ts" | xargs grep -l "from.*supabase\|import.*supabase" | sort

echo ""
echo "Total files to migrate:"
find app -name "*.tsx" -o -name "*.ts" | xargs grep -l "from.*supabase\|import.*supabase" | wc -l


#!/bin/bash
# [Q]uantelix — Development Server
echo "  ___   _   _  ___ _   _ ___ _   _ ___ "
echo " / _ \ | | | |/ __| | | | _ \ | | |_ _|"
echo "| (_) || |_| | (__| |_| |  _/ |_| || | "
echo " \__\_\ \___/ \___|\___/|_|  \___/|___|"
echo "  AGENTIC AI. INTELLIGENCE THAT ACTS."
echo ""
echo "Starting development server..."
cd "$(dirname "$0")/../web"
npm run dev

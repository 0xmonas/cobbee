#!/bin/bash
echo "Testing payment endpoint rate limit (10 req/min)..."
for i in {1..12}; do
  echo "========== Request $i =========="
  response=$(curl -X POST http://localhost:3000/api/support/buy \
    -H "Content-Type: application/json" \
    -d '{"creator_id":"test","supporter_name":"Test","coffee_count":1}' \
    -w "\n%{http_code}" \
    -s)
  
  status=$(echo "$response" | tail -1)
  body=$(echo "$response" | head -n -1)
  
  echo "Status: $status"
  echo "$body" | grep -o '"error":"[^"]*"' || echo "OK"
  echo ""
  
  if [ $i -lt 12 ]; then
    sleep 0.5
  fi
done

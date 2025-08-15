# Server Management Guide

## Quick Start

```bash
# Start the development server
./server-manager.sh start

# Check if everything is running
./server-manager.sh status

# View logs if there are issues
./server-manager.sh logs
./server-manager.sh errors
```

## Available Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `start` or `dev` | Start development server | Begin development work |
| `stop` | Stop the server | End development session |
| `restart` | Restart the server | Apply configuration changes |
| `status` | Show server status | Check if server is running |
| `logs` | Show recent logs | Debug general issues |
| `errors` | Show error logs | Debug specific errors |
| `build` | Build for production | Prepare for deployment |
| `preview` | Preview production build | Test production build locally |
| `cleanup` | Clean temporary files | Maintenance |

## Server Information

- **Development Port**: 8080
- **Preview Port**: 4173
- **Log Files**: `.server.log`, `.error.log`
- **PID File**: `.server.pid`

## Troubleshooting

### Server Won't Start
1. Check if port 8080 is already in use: `lsof -ti:8080`
2. View error logs: `./server-manager.sh errors`
3. Clean up and retry: `./server-manager.sh cleanup && ./server-manager.sh start`

### Server Not Responding
1. Check status: `./server-manager.sh status`
2. View recent logs: `./server-manager.sh logs`
3. Restart if needed: `./server-manager.sh restart`

### Build Issues
1. Clean node_modules: `rm -rf node_modules && npm install`
2. Check for TypeScript errors: `npm run lint`
3. Try building: `./server-manager.sh build`

## Development Workflow

### Daily Development
```bash
# Start your day
./server-manager.sh start

# Check everything is working
./server-manager.sh status

# During development, if you need to restart
./server-manager.sh restart

# End of day
./server-manager.sh stop
```

### Debugging Session
```bash
# Check current status
./server-manager.sh status

# View recent activity
./server-manager.sh logs

# Check for errors
./server-manager.sh errors

# Restart with fresh logs
./server-manager.sh restart
```

### Pre-Deployment
```bash
# Build and test
./server-manager.sh build
./server-manager.sh preview

# Clean up
./server-manager.sh cleanup
```

## Monitoring Features

The server manager provides:
- **Process tracking**: PID, memory usage, CPU usage
- **Port monitoring**: Checks if the server is responding
- **Log separation**: Separate files for general logs and errors
- **Health checks**: Verifies server accessibility
- **Graceful shutdown**: Attempts clean shutdown before force kill

## Integration with Development Tools

- **Vite HMR**: Hot module replacement works seamlessly
- **TypeScript**: Compilation errors appear in error logs
- **ESLint**: Linting errors are captured
- **Tailwind**: CSS compilation is monitored
- **Supabase**: Database connection status is logged
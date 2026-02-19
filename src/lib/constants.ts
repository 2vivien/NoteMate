// Network simulation constants
export const MIN_LATENCY = 100;
export const MAX_LATENCY = 1500;
export const PACKET_LOSS_RATE = 0.01; // 1%
export const DEFAULT_ACK_RATE = 99.9;

// User simulation constants
export const SIMULATED_USERS = 3;
export const USER_ACTION_INTERVAL_MIN = 2000;
export const USER_ACTION_INTERVAL_MAX = 8000;
export const TYPING_DURATION_MIN = 1500;
export const TYPING_DURATION_MAX = 4000;

// Editor constants
export const DEFAULT_DOCUMENT_NAME = 'system_architecture.md';
export const DEFAULT_CONTENT = `# System Architecture v2.4

apiVersion: v1
kind: Deployment
metadata:
  name: api-gateway-service

spec:
  replicas: 3
  selector:
    matchLabels:
      app: gateway
  template:
    metadata:
      labels:
        app: gateway-pod
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        ports:
        - containerPort: 80

---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
spec:
  selector:
    app: gateway
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer`;

// User presets for simulation
export const PRESET_USERS = [
  {
    id: 'user-alice',
    name: 'Alice',
    color: '#10b981', // emerald
    avatar: 'https://i.pravatar.cc/150?u=alice',
  },
  {
    id: 'user-bob',
    name: 'Bob',
    color: '#f59e0b', // amber
    avatar: 'https://i.pravatar.cc/150?u=bob',
  },
  {
    id: 'user-charlie',
    name: 'Charlie',
    color: '#8b5cf6', // violet
    avatar: 'https://i.pravatar.cc/150?u=charlie',
  },
];

// Session constants
export const SESSION_ID = '#AF92-K921';

// Theme constants
export const THEME_LIGHT = 'light';
export const THEME_DARK = 'dark';

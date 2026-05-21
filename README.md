# Relay

Relay is a system that enables quick reporting of equipment faults by scanning QR codes placed on hardware. The entire system is based on a central API server that communicates with three platforms: web, mobile, and desktop applications. The system supports installers, service technicians, and end-users, allowing them to conveniently generate QR codes, report faults, and manage reports.

## Project Goal

The goal of the application is to enable installers and service technicians to generate a QR code for an installed device, containing all the information necessary for future fault reporting. A QR code placed on the device allows anyone—a company employee, an end-user, or a bystander—to quickly report a failure, and the technician to immediately receive the full context of the event.

The system is designed to shorten response times, improve communication, and provide a full history of devices and reports.

## Example Usage

Installer X installs device Y at company Z. After completing the installation, they generate a QR code containing information about the device (location, type, installation date, serial number, additional notes). The code is printed and attached to the device.

Some time later, an employee at company Z notices that device Y is not working correctly. They scan the QR code with their phone, which takes them to a reporting form in a browser or mobile app. They fill in the description of the fault, add photos, and provide contact details.

## Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- **Node.js** (check `.nvmrc` for the recommended version)
- **pnpm** (used as the package manager)

### Installation & Running

1. **Clone the repository**:

   ```bash
   git clone https://github.com/krzysztofkozyra021/relay-desktop.git
   cd relay-desktop
   ```

2. **Install dependencies**:

   ```bash
   make install
   ```

3. **Run the development server**:

   ```bash
   make dev
   ```

## Environment Variables

Copy the `.env.example` file to `.env` to configure your local environment:

```bash
cp .env.example .env
```

**`VITE_APP_DEBUG`**
# Set to "test" to enable debug mode: auto-fill buttons, seed DB, auto-login

## Development Tasks

The project includes a `Makefile` to simplify typical development tasks using `pnpm`.

| Command          | Description                                       |
|:-----------------|:--------------------------------------------------|
| `make install`   | Install project dependencies                      |
| `make dev`       | Start the development server with hot-reloading   |
| `make build`     | Build the application for production              |
| `make lint`      | Check code style and errors using Biome           |
| `make fix`       | Automatically fix code style errors               |
| `make typecheck` | Run the TypeScript compiler to check for errors   |
| `make test`      | Run the Vitest suite once                         |
| `make test:watch`| Run the Vitest suite in watch mode                |
| `make clean`     | Remove development and build artifacts            |
| `make release`   | Create a production release and publish it        |
| `make help`      | Display the list of available commands            |

## Running Tests

Unit tests live in the `tests/` directory and are powered by [Vitest](https://vitest.dev/).

```bash
make test            # one-shot run
make test:watch      # watch mode

# or directly via pnpm
pnpm test            # one-shot run
pnpm test:watch      # watch mode
pnpm test:ui         # interactive Vitest UI in the browser
```

> **Note:** the tests use `better-sqlite3` against the **system Node**, while `make dev`/`make build` need it compiled against **Electron's Node**. If the test runner reports a `NODE_MODULE_VERSION` mismatch, rebuild the native binding:
>
> ```bash
> npm rebuild better-sqlite3 --update-binary   # for tests (system Node)
> make install                                 # switch back to Electron's Node
> ```

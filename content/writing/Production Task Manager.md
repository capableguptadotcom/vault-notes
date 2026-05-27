---
title: Task Manager
publish: true
---

This implementation provides a robust manager for handling both I/O and CPU-bound tasks in a production FastAPI environment.

## 🛠️ Implementation

```python
import asyncio
import uuid
import logging
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
from typing import Callable, Dict, Any

logger = logging.getLogger(__name__)

class ProductionTaskManager:
    def __init__(self, max_io_workers=20, max_cpu_workers=4):
        self.io_executor = ThreadPoolExecutor(max_workers=max_io_workers, thread_name_prefix="io_")
        self.cpu_executor = ProcessPoolExecutor(max_workers=max_cpu_workers)
        self.tasks: Dict[str, Dict[str, Any]] = {}

    async def run_io(self, func: Callable, *args, **kwargs) -> str:
        """Run I/O bound blocking function in thread pool."""
        task_id = f"io_{uuid.uuid4().hex[:8]}"
        self.tasks[task_id] = {"status": "running", "type": "io"}

        loop = asyncio.get_running_loop()
        try:
            result = await loop.run_in_executor(self.io_executor, lambda: func(*args, **kwargs))
            self.tasks[task_id].update({"status": "completed", "result": result})
        except Exception as e:
            self.tasks[task_id].update({"status": "failed", "error": str(e)})
            logger.error(f"Task {task_id} failed: {e}")
        return task_id

    async def run_cpu(self, func: Callable, *args, **kwargs) -> str:
        """Run CPU bound function in process pool (bypasses GIL)."""
        task_id = f"cpu_{uuid.uuid4().hex[:8]}"
        self.tasks[task_id] = {"status": "running", "type": "cpu"}

        loop = asyncio.get_running_loop()
        try:
            result = await loop.run_in_executor(self.cpu_executor, lambda: func(*args, **kwargs))
            self.tasks[task_id].update({"status": "completed", "result": result})
        except Exception as e:
            self.tasks[task_id].update({"status": "failed", "error": str(e)})
            logger.error(f"Task {task_id} failed: {e}")
        return task_id

    def shutdown(self):
        self.io_executor.shutdown(wait=True)
        self.cpu_executor.shutdown(wait=True)

# Usage in FastAPI
# task_manager = ProductionTaskManager()
# @app.on_event("shutdown")
# def stop_manager(): task_manager.shutdown()
```

## 🚀 Key Advantages

1. **Separation of Concerns**: Threads for network/disk, Processes for math/processing.
2. **Non-Blocking**: The main event loop stays free to serve incoming HTTP requests.
3. **Task Tracking**: Assigns unique IDs and tracks status/results for polling.
4. **Retry-Ready**: Can be easily extended with `tenacity` for automatic retries.

## ⚠️ When to move to Celery/Redis

- If you need **Persistency** across server restarts.
- If you need to **Distributed** tasks across multiple servers.
- If you need a web UI for task monitoring (e.g., Flower).

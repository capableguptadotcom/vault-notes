---
Last edited time: 2024-05-23T13:11
publish: true
---

Link and resources

- [https://stackoverflow.com/questions/27435284/multiprocessing-vs-multithreading-vs-asyncio](https://stackoverflow.com/questions/27435284/multiprocessing-vs-multithreading-vs-asyncio)
- [https://stackoverflow.com/questions/20886565/using-multiprocessing-process-with-a-maximum-number-of-simultaneous-processes](https://stackoverflow.com/questions/20886565/using-multiprocessing-process-with-a-maximum-number-of-simultaneous-processes)
- [http://masnun.rocks/2016/10/06/async-python-the-different-forms-of-concurrency/](http://masnun.rocks/2016/10/06/async-python-the-different-forms-of-concurrency/)
- [https://pymotw.com/3/multiprocessing/index.html](https://pymotw.com/3/multiprocessing/index.html)
- [https://pymotw.com/3/concurrent.futures/](https://pymotw.com/3/concurrent.futures/)

Good read ( multiprocessing and multithreading ) - >

> [!info] Python Multithreading and Multiprocessing Tutorial | Toptal®  
> Python is a popular, powerful, and versatile programming language; however, concurrency and parallelism in Python often seems to be a matter of debate.  
> [https://www.toptal.com/python/beginners-guide-to-concurrency-and-parallelism-in-python](https://www.toptal.com/python/beginners-guide-to-concurrency-and-parallelism-in-python)

https://heyashy.medium.com/blazing-fast-etls-with-simultaneous-multiprocessing-and-multithreading-214865b56516

### Questions , stuff and understanding

- threading
  - when not to use threading , advised almost never to use it , refer the `raymond hettinger` lecture , how can we replace it with async and other learnings \*\*imp
- `async` and `asyncio`
  - asycio part of python lib , provide infra for writing concurrent code using `async/await` .
  - `async` is just a keyword that indicates that a function is a `coroutine` function which can be used with `**await**` to pause the execution of the coroutine until a result is available
  - `asyncio` provides additional functionality for managing coroutines, such as an event loop, which is responsible for scheduling and executing coroutines, and various APIs for performing I/O operations asynchronously
  ```Python
  import asyncio

  async def my_coroutine():
      print("Coroutine started")
      await asyncio.sleep(1)
      print("Coroutine ended")

  asyncio.run(my_coroutine())
  ```
  In this example, the `**asyncio.run()**` function is used to run the `**my_coroutine()**` coroutine function. The `**await asyncio.sleep(1)**` line pauses the execution of the coroutine for one second, allowing other coroutines to run in the meantime.
  `**yield**`: In the context of generators, `**yield**` is used to produce a value to the caller and suspend the execution of the generator function until the next value is requested. When used in asynchronous generators, it allows the generator to produce values asynchronously. However, it does not provide the same level of control over asynchronous code execution as `**await**` does
  ```Python
  # examples of async programming
  import asyncio

  async def read_file():
      async with open('example.txt', 'r') as file:
          data = await file.read()
          print(data)

  asyncio.run(read_file())


  import asyncio

  async def task1():
      print("Task 1 started")
      await asyncio.sleep(2)
      print("Task 1 completed")

  async def task2():
      print("Task 2 started")
      await task1()  # Task 2 depends on the completion of Task 1
      print("Task 2 completed")

  async def main():
      await asyncio.gather(task1(), task2())

  asyncio.run(main())

  import asyncio
  import aiohttp

  async def fetch_data():
      async with aiohttp.ClientSession() as session:
          async with session.get('https://api.example.com/data') as response:
              data = await response.json()
              print(data)

  asyncio.run(fetch_data())
  ```
- process ( w.r.t to concurrent futures and direct threading library ),
  - heard about in terms of cpu intensive tasks , where overhead doesnt bother you that much , but yeah explore on it , see why we even need it .

### Best of both worlds \*\*

we have an idea to not use threads , until it is specifically asked for , or there is already code written and we dont want to reinvent the wheel for async

Combining both a Process Pool for CPU-bound tasks and asyncio for network-bound tasks can be a powerful approach, leveraging the strengths of each. Below is an example demonstrating how you can switch between the two based on the nature of tasks. We'll use the `**asyncio.run_in_executor()**` function to run CPU-bound tasks in a Process Pool within the asyncio event loop.

```Python
import asyncio
from concurrent.futures import ProcessPoolExecutor

async def cpu_bound_task(arg):
    # Simulating a CPU-bound task
    result = arg * arg
    return result

async def network_task(arg):
    # Simulating a network-bound task
    await asyncio.sleep(1)  # Simulating network latency
    result = arg + 1
    return result

async def main():
    # Example data
    iterable_of_arguments = range(5)

    # Create a Process Pool Executor
    with ProcessPoolExecutor() as pool_executor:
        # List to store tasks
        tasks = []

        for arg in iterable_of_arguments:
            # Decide whether to use Process Pool or asyncio based on the nature of the task
            if arg % 2 == 0:
                # If the argument is even, run a CPU-bound task using the Process Pool
                task = loop.run_in_executor(pool_executor, cpu_bound_task, arg)
            else:
                # If the argument is odd, run a network-bound task using asyncio
                task = network_task(arg)

            tasks.append(task)

        # Gather and await all tasks
        results = await asyncio.gather(*tasks)

        # Print the results
        print("Results:", results)

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
    loop.close()
```

- `**cpu_bound_task**` simulates a CPU-bound task by squaring the argument.
- `**network_task**` simulates a network-bound task by introducing an artificial sleep.
- In the `**main**` function, we create a Process Pool Executor and iterate through a set of arguments.
- For even arguments, we use `**loop.run_in_executor()**` to run a CPU-bound task in the Process Pool.
- For odd arguments, we run a network-bound task using asyncio directly.
- The results are gathered and printed at the end.

### Asycio Notes

> [!info] Python Asyncio: The Complete Guide - Super Fast Python  
> Python Asyncio, your complete guide to coroutines and the asyncio module for concurrent programming in Python.  
> [https://superfastpython.com/python-asyncio/](https://superfastpython.com/python-asyncio/)

[https://medium.com/@superfastpython/python-asyncio-7-day-crash-course-f946b3a02e48](https://medium.com/@superfastpython/python-asyncio-7-day-crash-course-f946b3a02e48)

Examples of multiprocessing

```JavaScript
import multiprocessing
import numpy as np

def backprop_worker(inputs, weights, biases, target, learning_rate):
    # forward pass
    activations = np.dot(inputs, weights) + biases
    output = sigmoid(activations)

    # backward pass
    error = target - output
    gradient = error * sigmoid_derivative(output)
    weights_delta = learning_rate * np.dot(inputs.T, gradient)
    biases_delta = learning_rate * np.sum(gradient, axis=0)

    return weights_delta, biases_delta

def parallel_backprop(inputs, weights, biases, targets, learning_rate, num_processes=2):
    pool = multiprocessing.Pool(num_processes)
    results = [pool.apply_async(backprop_worker, (inputs[i], weights, biases, targets[i], learning_rate))
               for i in range(inputs.shape[0])]
    weights_deltas = [r.get()[0] for r in results]
    biases_deltas = [r.get()[1] for r in results]

    # averaging deltas from all processes
    avg_weights_delta = np.mean(weights_deltas, axis=0)
    avg_biases_delta = np.mean(biases_deltas, axis=0)

    # updating weights and biases
    weights += avg_weights_delta
    biases += avg_biases_delta

    return weights, biases
```

code uses the `**multiprocessing**`  
library to parallelize the backpropagation of a neural network by dividing the inputs into separate chunks and processing each chunk in a separate process. The  
`**backprop_worker**`  
function performs the forward and backward pass for a single input, and the  
`**parallel_backprop**`  
function uses the  
`**multiprocessing.Pool**`  
class to create a pool of processes and apply the  
`**backprop_worker**`  
function to each input in parallel. The results of the workers are collected and averaged to update the weights and biases of the network.

> `Multiprocessing` library helps to par `parallelize` the function by dividing the input into seperate chunks and process each chunk in a seperate process

Q/A

- How to calculate the number of process we could initilaize ?
- What are the pros and cons for concurrent futures module ?

Same example using Threading library

```JavaScript
import threading
import numpy as np

def backprop_worker(inputs, weights, biases, target, learning_rate, results):
    # forward pass
    activations = np.dot(inputs, weights) + biases
    output = sigmoid(activations)

    # backward pass
    error = target - output
    gradient = error * sigmoid_derivative(output)
    weights_delta = learning_rate * np.dot(inputs.T, gradient)
    biases_delta = learning_rate * np.sum(gradient, axis=0)

    results.append((weights_delta, biases_delta))

def parallel_backprop(inputs, weights, biases, targets, learning_rate, num_threads=2):
    results = []
    threads = [threading.Thread(target=backprop_worker,
                                args=(inputs[i], weights, biases, targets[i], learning_rate, results))
               for i in range(inputs.shape[0])]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    # averaging deltas from all threads
    weights_deltas = [r[0] for r in results]
    biases_deltas = [r[1] for r in results]
    avg_weights_delta = np.mean(weights_deltas, axis=0)
    avg_biases_delta = np.mean(biases_deltas, axis=0)

    # updating weights and biases
    weights += avg_weights_delta
    biases += avg_biases_delta

    return weights, biases
```

the `**threading.Thread**`class to create a list of threads and start them. The threads are then joined to wait for their completion before collecting and averaging the results.

Cons of using `**threading**` over `**multiprocessing**`:

- `Limited parallelism`: Threads run in the same memory space, so they are subject to the Global Interpreter Lock (GIL), which limits parallelism. In other words, only one thread can execute Python bytecode at a time, even on multiple cores.
- `Sharing memory`: Sharing memory between threads can be difficult and requires careful synchronization, as there is no built-in mechanism to ensure that changes made by one thread are visible to other threads.

In conclusion, `**threading**` can be a good option for parallelizing code if the work is CPU-bound and the overhead of creating and managing separate processes is not desired. However, if the work is I/O-bound or if you need to take advantage of multiple cores, `**multiprocessing**`  
may be a better choice.

Threads are better suited for I/O-bound tasks, while Pool functions are better suited for CPU-bound tasks. Generally speaking, if your task involves a lot of waiting on a response from an external source, such as a web server or a database, then it is better to use threading. On the other hand, if your task involves lots of computation or manipulation of data, then it is better to use the Pool functions to take advantage of parallel processing.

Parallelize a function with multiple arguments using the multiprocessing library, you can use the Pool.starmap() method. This method takes a function, a list of tuples containing the arguments, and an optional chunksize argument to specify how many arguments should be processed in each chunk. For example, if you have a function called my_function that takes two arguments, you could call it like this:

```JavaScript
from multiprocessing import Pool

# Create a Pool object
pool = Pool(processes=4)

# Create a list of tuples containing the arguments
args = [(1, 2), (3, 4), (5, 6), (7, 8)]

# Pass the list of tuples as the first argument to Pool.starmap()
pool.starmap(my_function, args)
```

```JavaScript
import pandas as pd
from multiprocessing import Pool

# Create a Pool object
pool = Pool(processes=4)

# Read a dataframe into memory
df = pd.read_csv('data.csv')

# Create a list of chunks of the dataframe
chunks = [df[i:i+1000] for i in range(0, len(df), 1000)]

# Pass the chunks as arguments to the function
pool.map(my_function, chunks)

pool.close()

pool.join()
```

The main difference between the `Pool.map` and Pool.apply*async methods in the multiprocessing module is that the Pool.map method blocks until all tasks in the iterable have been completed, while the* `_Pool.apply_` `async` method returns a ApplyResult object that can be used to check the status of the task. Additionally, Pool.map will return results in the same order as the inputs, while Pool.apply_async will return results in any order.

> always call `pool.close` and then `pool.Join` after the main for loop or result ,

if not , memory issues and retracing the error would be hard - > below is the link for better understanding

[https://stackoverflow.com/questions/38271547/when-should-we-call-multiprocessing-pool-join](https://stackoverflow.com/questions/38271547/when-should-we-call-multiprocessing-pool-join)

```JavaScript
from multiprocessing import Pool, TimeoutError
import time
import os

def f(x):
    return x*x

if __name__ == '__main__':
    # start 4 worker processes
    with Pool(processes=4) as pool:

        # print "[0, 1, 4,..., 81]"
        print(pool.map(f, range(10)))

        # print same numbers in arbitrary order
        for i in pool.imap_unordered(f, range(10)):
            print(i)

				#! we can run it in loop and get reults by iterating
        # evaluate "f(20)" asynchronously
        res = pool.apply_async(f, (20,))      # runs in *only* one process
        print(res.get(timeout=1))             # prints "400"

        # evaluate "os.getpid()" asynchronously
        res = pool.apply_async(os.getpid, ()) # runs in *only* one process
        print(res.get(timeout=1))             # prints the PID of that process

        # launching multiple evaluations asynchronously *may* use more processes
        multiple_results = [pool.apply_async(os.getpid, ()) for i in range(4)]
        print([res.get(timeout=1) for res in multiple_results])

        # make a single worker sleep for 10 seconds
        res = pool.apply_async(time.sleep, (10,))
        try:
            print(res.get(timeout=1))
        except TimeoutError:
            print("We lacked patience and got a multiprocessing.TimeoutError")

        print("For the moment, the pool remains available for more work")

    # exiting the 'with'-block has stopped the pool
    print("Now the pool is closed and no longer available")
```

diff btw. `concurrent.futures` & `multiprocessing` ?

The main difference between the concurrent.futures library and multiprocessing is the level of abstraction they provide. The concurrent.futures library provides a high-level interface for running tasks in the background, while multiprocessing requires more manual coding to create the processes and manage their execution.

The concurrent.futures library is a great choice for applications that require a high level of parallelism and don't require a lot of customization. It is also a great choice for applications that need to manage a large number of tasks. On the other hand, multiprocessing is better suited for applications that require a lot of customization and control over the execution of the tasks. Additionally, multiprocessing is more efficient in terms of memory usage, as it allows you to create and destroy processes as needed.

diff b/w `map` , `apply_async`

map → order isn’t affected , plus it blocks until every process is executed

apply_async → return in random order , doesn’t block memory and other things can be executed

> we have covered multiple arguments, single arguments and low level implementation

TODO : → concurrent.futures , plus robust examples of threading

Informative & have code examples of when to use which

multiprocessing or concurrent.futures ( i think concurrent futures have simpler api )

code to show the difference

```Python
def create_index(contexts: List[str], embeddings: Embeddings) -> np.ndarray:
    """
    Create an index of embeddings for a list of contexts.

    Args:
        contexts: List of contexts to embed.
        embeddings: Embeddings model to use.

    Returns:
        Index of embeddings.
    """
    with concurrent.futures.ThreadPoolExecutor() as executor:
        return np.array(list(executor.map(embeddings.embed_query, contexts)))
```

```Python
from multiprocessing import Pool

\#load mapping
LOADER_MAPPING = {
    ".csv": (CSVLoader, {}),
    ".docx": (UnstructuredWordDocumentLoader, {}),
    ".eml": (UnstructuredEmailLoader, {}),
    ".epub": (UnstructuredEPubLoader, {}),
    ".html": (UnstructuredHTMLLoader, {}),
    ".md": (UnstructuredMarkdownLoader, {}),
    ".odt": (UnstructuredODTLoader, {}),
    ".pdf": (PyMuPDFLoader, {}),
    ".pptx": (UnstructuredPowerPointLoader, {}),
    ".txt": (TextLoader, {"encoding": "utf8"}),
}


def load_single_document(file_path: str) -> List[Document]:
    ext = "." + file_path.rsplit(".", 1)[-1]
    if ext in LOADER_MAPPING:
        loader_class, loader_args = LOADER_MAPPING[ext]
        loader = loader_class(file_path, **loader_args)
        return loader.load()

    raise ValueError(f"Unsupported file extension '{ext}'")


def load_documents(source_dir: str, ignored_files: List[str] = []) -> List[Document]:
    """
    Loads all documents from the source documents directory, ignoring specified files
    """
    all_files = []
    for ext in LOADER_MAPPING:
        all_files.extend(
            glob.glob(os.path.join(source_dir, f"**/*{ext}"), recursive=True)
        )
        print(all_files)
    filtered_files = [
        file_path for file_path in all_files if file_path not in ignored_files
    ]

    with Pool(processes=os.cpu_count()) as pool:
        results = []
        with tqdm(
            total=len(filtered_files), desc="Loading new documents", ncols=80
        ) as pbar:
            for i, docs in enumerate(
                pool.imap_unordered(load_single_document, filtered_files)
            ):
                results.extend(docs)
                pbar.update()

    return results
```

### MUST READ ( Very Informative )

[https://stackoverflow.com/questions/20776189/concurrent-futures-vs-multiprocessing-in-python-3](https://stackoverflow.com/questions/20776189/concurrent-futures-vs-multiprocessing-in-python-3)

1-2 questions are → i havent seen speedup using thread pool executor in real circumstances ( i/o bound operations )

Example of thread pool executor

```Python
from concurrent.futures import ThreadPoolExecutor
import logging

BATCH_SIZE = 1000
NUM_WORKERS = 10

def create_search_client(index_name):
    return SearchClient(
        endpoint=SEARCH_SERVICE_ENDPOINT, index_name=index_name, credential=credential
    )

def upload_documents_to_index(client, documents):
    def upload_batch(batch):
        try:
            result = client.merge_or_upload_documents(documents=batch)
            if result.is_error:
                for error in result.errors:
                    logging.error(
                        f"Failed to upload document with ID: {error.key}, error: {error.error.message}"
                    )
            else:
                logging.info("Successfully uploaded batch")
        except Exception as e:
            logging.error(f"Failed to upload batch: {e}")

    with ThreadPoolExecutor(max_workers=NUM_WORKERS) as executor:
        for i in range(0, len(documents), BATCH_SIZE):
            batch = documents[i : i + BATCH_SIZE]
            executor.submit(upload_batch, batch)

index_names = ["dbpedia-1m-baseline", "dbpedia-1m-stored", "dbpedia-1m-scalar-quantization", "dbpedia-1m-both"]
for index_name in index_names:
    client = create_search_client(index_name)
    upload_documents_to_index(client, transformed_documents
```

# Ex-9: Implementation of Parallel Processing using MPI and OpenMP

These commands are for **Ubuntu/Linux** (as shown in the lab manual). Run them in the Terminal.

## 1. Install the required packages

```bash
sudo apt update
sudo apt install build-essential openmpi-bin libopenmpi-dev
```

Check the installations:

```bash
gcc --version
mpicc --version
mpirun --version
```

## 2. Create a folder for the experiment

```bash
mkdir -p ~/Ex9
cd ~/Ex9
```

---

## Program 1: MPI Array Sum

### 3. Create the source file

```bash
gedit hello.c
```

Paste and save this code:

```c
#include <stdio.h>
#include <mpi.h>

int main(int argc, char *argv[])
{
    int rank, size;
    int n = 8;
    int array[] = {1, 2, 3, 4, 5, 6, 7, 8};
    int local_sum = 0;
    int total_sum = 0;

    MPI_Init(&argc, &argv);
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);

    if (size != 4) {
        if (rank == 0)
            printf("Run this program with 4 processes.\\n");
        MPI_Finalize();
        return 0;
    }

    int elements_per_process = n / size;
    int start = rank * elements_per_process;
    int end = start + elements_per_process;

    for (int i = start; i < end; i++)
        local_sum += array[i];

    printf("Process %d calculated local sum = %d\\n", rank, local_sum);

    MPI_Reduce(&local_sum, &total_sum, 1, MPI_INT, MPI_SUM, 0,
               MPI_COMM_WORLD);

    if (rank == 0)
        printf("Total sum = %d\\n", total_sum);

    MPI_Finalize();
    return 0;
}
```

### 4. Compile

```bash
mpicc hello.c -o hello
```

### 5. Run with 4 MPI processes

```bash
mpirun -np 4 ./hello
```

If OpenMPI refuses to run because the terminal is running as root (not normally needed on a personal Ubuntu account), do not use root if you can avoid it. For a root-only lab container, OpenMPI may require its documented allow-run-as-root option.

Expected result (process order can vary):

```text
Process 0 calculated local sum = 3
Process 1 calculated local sum = 7
Process 2 calculated local sum = 11
Process 3 calculated local sum = 15
Total sum = 36
```

---

## Program 2: MPI Send and Receive

### 6. Create the source file

```bash
gedit open_mpi.c
```

Paste and save this code:

```c
#include <stdio.h>
#include <mpi.h>

int main(int argc, char *argv[])
{
    int rank, size;
    int number;

    MPI_Init(&argc, &argv);
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);

    if (size < 2) {
        if (rank == 0)
            printf("Please run with at least 2 processes.\\n");
        MPI_Finalize();
        return 0;
    }

    if (rank == 0) {
        number = 100;
        printf("Process 0 sending number: %d\\n", number);
        MPI_Send(&number, 1, MPI_INT, 1, 0, MPI_COMM_WORLD);
    } else if (rank == 1) {
        MPI_Recv(&number, 1, MPI_INT, 0, 0, MPI_COMM_WORLD,
                 MPI_STATUS_IGNORE);
        printf("Process 1 received number: %d\\n", number);
    }

    MPI_Finalize();
    return 0;
}
```

### 7. Compile

```bash
mpicc open_mpi.c -o open_mpi
```

### 8. Run with 2 MPI processes

```bash
mpirun -np 2 ./open_mpi
```

Expected output:

```text
Process 0 sending number: 100
Process 1 received number: 100
```

**Important:** The lab manual's `gcc open_mpi.c -o open_mpi` and `./open_mpi` commands omit the MPI launcher. Use `mpicc` and `mpirun -np 2` for a normal MPI run.

---

## Program 3: OpenMP Student Marks Processing

### 9. Create the source file

```bash
gedit open_mp.c
```

Paste and save this code:

```c
#include <stdio.h>
#include <omp.h>

int main(void)
{
    int marks[] = {75, 60, 45, 80, 55, 90, 35, 70};
    int n = 8;
    int total = 0;
    int pass_count = 0;
    int last_student = -1;
    int start = 100;

    printf("=== STUDENT MARKS PROCESSING ===\\n");

    #pragma omp parallel for firstprivate(start) reduction(+:total) lastprivate(last_student)
    for (int i = 0; i < n; i++) {
        int thread_id = omp_get_thread_num();
        int adjusted_mark = marks[i] + start - 100;

        printf("Thread %d processing Student %d: Mark = %d\\n",
               thread_id, i + 1, adjusted_mark);

        total += adjusted_mark;

        if (adjusted_mark >= 50) {
            #pragma omp critical
            {
                pass_count++;
            }
        }

        last_student = i;
    }

    printf("\\n=== RESULTS ===\\n");
    printf("Total marks       = %d\\n", total);
    printf("Number of passes  = %d\\n", pass_count);
    printf("Last student      = %d\\n", last_student + 1);
    printf("Average marks     = %.2f\\n", (float)total / n);

    return 0;
}
```

### 10. Compile with OpenMP enabled

```bash
gcc -fopenmp open_mp.c -o open_mp
```

### 11. Run

```bash
./open_mp
```

Optional: choose the number of threads (for example, 4):

```bash
OMP_NUM_THREADS=4 ./open_mp
```

Expected final results:

```text
Total marks       = 510
Number of passes  = 6
Last student      = 8
Average marks     = 63.75
```

The order of thread messages may differ each time because threads run in parallel.

---

## 12. Run all programs again

From the experiment folder:

```bash
cd ~/Ex9
mpicc hello.c -o hello
mpirun -np 4 ./hello

mpicc open_mpi.c -o open_mpi
mpirun -np 2 ./open_mpi

gcc -fopenmp open_mp.c -o open_mp
./open_mp
```

## 13. Stop a running program

If a program is still running in the foreground, press:

```text
Ctrl + C
```

To return to the shell after a program finishes, no extra command is needed.

## 14. List the files

```bash
ls -l
```

Expected files:

```text
hello.c
hello
open_mpi.c
open_mpi
open_mp.c
open_mp
```

## Result

Parallel processing examples using MPI and OpenMP have been compiled and executed. MPI demonstrates process-based communication and reduction, while OpenMP demonstrates thread-based parallel processing of student marks.

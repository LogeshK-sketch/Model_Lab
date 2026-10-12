# Hadoop 3.3.6 Single-Node Setup and Word Count

Commands for the Hadoop Ex-8 lab: install prerequisites, configure Hadoop, compile WordCount.java, run MapReduce, and view the output.

> Run these commands in an Ubuntu terminal. Some commands edit configuration files; follow the notes carefully.
> If `apt` reports that another process holds the package lock, do not delete the lock files. Let the updater finish, then retry.

## 1. Fix/check system time and update Ubuntu

```bash
date
timedatectl status
sudo timedatectl set-ntp true
```

If Chrony is already installed and running:
```bash
sudo systemctl status chrony
chronyc tracking
sudo chronyc makestep
date
```

Update package lists:
```bash
sudo apt clean
sudo apt update
```

If `apt` says the package manager is locked, inspect the process shown in the error:
```bash
ps -fp <PID>
```

Replace `<PID>` with the process ID from the error. If it is an automatic updater, wait for it to finish. If you need to stop the waiting `apt install` command, press `Ctrl+C`; this does not stop the background updater.

Check the updater:
```bash
sudo systemctl status unattended-upgrades
```

Only if it is genuinely stuck and you have confirmed it is safe to stop:
```bash
sudo systemctl stop unattended-upgrades
```

If package configuration was interrupted:
```bash
sudo dpkg --configure -a
```

Do not manually delete `/var/lib/dpkg/lock-frontend` or other lock files.

## 2. Install Java and tools

```bash
sudo apt install openjdk-11-jdk ssh rsync wget -y
java -version
javac -version
```

## 3. Download and extract Hadoop 3.3.6

```bash
cd ~
wget https://archive.apache.org/dist/hadoop/common/hadoop-3.3.6/hadoop-3.3.6.tar.gz
tar -xzf hadoop-3.3.6.tar.gz
mv hadoop-3.3.6 hadoop
```

If `~/hadoop` already exists, do not overwrite it blindly. Check it first:
```bash
ls -ld ~/hadoop
```

## 4. Set environment variables

Open the Bash configuration:
```bash
nano ~/.bashrc
```

Add these lines at the bottom:
```bash
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
export HADOOP_HOME=$HOME/hadoop
export HADOOP_INSTALL=$HADOOP_HOME
export HADOOP_MAPRED_HOME=$HADOOP_HOME
export HADOOP_COMMON_HOME=$HADOOP_HOME
export HADOOP_HDFS_HOME=$HADOOP_HOME
export YARN_HOME=$HADOOP_HOME
export PATH=$PATH:$HADOOP_HOME/bin:$HADOOP_HOME/sbin
```

Save Nano: `Ctrl+O`, `Enter`, `Ctrl+X`.

Apply and check:
```bash
source ~/.bashrc
hadoop version
```

## 5. Configure Java for Hadoop

```bash
nano ~/hadoop/etc/hadoop/hadoop-env.sh
```

Set or update this line:
```bash
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
```

Save and exit Nano.

## 6. Configure Hadoop XML files

Use your actual Ubuntu username in any absolute paths:
```bash
whoami
```

### 6.1 `core-site.xml`

```bash
nano ~/hadoop/etc/hadoop/core-site.xml
```

Set the file contents to:
```xml
<configuration>
    <property>
        <name>fs.defaultFS</name>
        <value>hdfs://localhost:9000</value>
    </property>
</configuration>
```

### 6.2 `hdfs-site.xml`

```bash
nano ~/hadoop/etc/hadoop/hdfs-site.xml
```

Replace `/home/REPLACE_USERNAME` below with your real home directory (for example, `/home/vboxuser`):
```xml
<configuration>
    <property>
        <name>dfs.replication</name>
        <value>1</value>
    </property>
    <property>
        <name>dfs.namenode.name.dir</name>
        <value>file:///home/REPLACE_USERNAME/hadoop/data/namenode</value>
    </property>
    <property>
        <name>dfs.datanode.data.dir</name>
        <value>file:///home/REPLACE_USERNAME/hadoop/data/datanode</value>
    </property>
</configuration>
```

### 6.3 `mapred-site.xml`

```bash
nano ~/hadoop/etc/hadoop/mapred-site.xml
```

Replace `/home/REPLACE_USERNAME` with your actual home directory:
```xml
<configuration>
    <property>
        <name>mapreduce.framework.name</name>
        <value>yarn</value>
    </property>
    <property>
        <name>yarn.app.mapreduce.am.env</name>
        <value>HADOOP_MAPRED_HOME=/home/REPLACE_USERNAME/hadoop</value>
    </property>
    <property>
        <name>mapreduce.map.env</name>
        <value>HADOOP_MAPRED_HOME=/home/REPLACE_USERNAME/hadoop</value>
    </property>
    <property>
        <name>mapreduce.reduce.env</name>
        <value>HADOOP_MAPRED_HOME=/home/REPLACE_USERNAME/hadoop</value>
    </property>
</configuration>
```

### 6.4 `yarn-site.xml`

```bash
nano ~/hadoop/etc/hadoop/yarn-site.xml
```

Set the file contents to:
```xml
<configuration>
    <property>
        <name>yarn.resourcemanager.hostname</name>
        <value>localhost</value>
    </property>
    <property>
        <name>yarn.nodemanager.aux-services</name>
        <value>mapreduce_shuffle</value>
    </property>
    <property>
        <name>yarn.nodemanager.aux-services.mapreduce.shuffle.class</name>
        <value>org.apache.hadoop.mapred.ShuffleHandler</value>
    </property>
</configuration>
```

Save each XML file and exit Nano.

## 7. Configure passwordless SSH to localhost

```bash
sudo service ssh start
```

Create a key only if you do not already have one. If `~/.ssh/id_rsa` exists, do not overwrite it.
```bash
mkdir -p ~/.ssh
ssh-keygen -t rsa -P '' -f ~/.ssh/id_rsa
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
ssh localhost
```

If asked to trust the host, type `yes`. Then leave the SSH session:
```bash
exit
```

## 8. Create Hadoop data directories and format NameNode

```bash
mkdir -p ~/hadoop/data/namenode
mkdir -p ~/hadoop/data/datanode
```

Format only when initializing a new Hadoop setup for the first time. Do not reformat an existing cluster with data:
```bash
hdfs namenode -format
```

## 9. Start Hadoop services

```bash
start-dfs.sh
start-yarn.sh
jps
```

Expected processes commonly include `NameNode`, `DataNode`, `SecondaryNameNode`, `ResourceManager`, and `NodeManager`.

Web interfaces:
- NameNode: http://localhost:9870
- ResourceManager: http://localhost:8088

## 10. Create the Word Count project and input

```bash
mkdir -p ~/wordcount
cd ~/wordcount
nano input.txt
```

Enter this text in `input.txt`:
```text
hello hadoop hello world hadoop is fun
```

Save and exit Nano.

## 11. Create `WordCount.java`

```bash
nano WordCount.java
```

Paste this Java program, then save and exit:

```java
import java.io.IOException;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

public class WordCount {
    public static class TokenizerMapper
            extends Mapper<Object, Text, Text, IntWritable> {
        private final static IntWritable one = new IntWritable(1);
        private Text word = new Text();

        public void map(Object key, Text value, Context context)
                throws IOException, InterruptedException {
            String[] words = value.toString().split("\\s+");
            for (String str : words) {
                word.set(str);
                context.write(word, one);
            }
        }
    }

    public static class IntSumReducer
            extends Reducer<Text, IntWritable, Text, IntWritable> {
        private IntWritable result = new IntWritable();

        public void reduce(Text key, Iterable<IntWritable> values, Context context)
                throws IOException, InterruptedException {
            int sum = 0;
            for (IntWritable val : values) {
                sum += val.get();
            }
            result.set(sum);
            context.write(key, result);
        }
    }

    public static void main(String[] args) throws Exception {
        Configuration conf = new Configuration();
        Job job = Job.getInstance(conf, "word count");
        job.setJarByClass(WordCount.class);
        job.setMapperClass(TokenizerMapper.class);
        job.setCombinerClass(IntSumReducer.class);
        job.setReducerClass(IntSumReducer.class);
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(IntWritable.class);
        FileInputFormat.addInputPath(job, new Path(args[0]));
        FileOutputFormat.setOutputPath(job, new Path(args[1]));
        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}
```

## 12. Compile and package the Java program

Run from `~/wordcount`:
```bash
export HADOOP_CLASSPATH=$(hadoop classpath)
mkdir -p wordcount_classes
javac -classpath "$HADOOP_CLASSPATH" -d wordcount_classes WordCount.java
jar -cvf wordcount.jar -C wordcount_classes/ .
```

## 13. Upload the input file to HDFS

```bash
hdfs dfs -mkdir -p /user/$USER/wordcount/input
hdfs dfs -put input.txt /user/$USER/wordcount/input/
hdfs dfs -ls /user/$USER/wordcount/input
```

If the file already exists in HDFS, `-put` may report that it exists. List the directory before deciding whether to remove or replace it.

## 14. Run the MapReduce job

The output directory must not already exist. If this is a rerun and you no longer need the previous output, remove it first:
```bash
hdfs dfs -rm -r /user/$USER/wordcount/output
```

Run the job:
```bash
hadoop jar wordcount.jar WordCount /user/$USER/wordcount/input /user/$USER/wordcount/output
```

## 15. Display the result

```bash
hdfs dfs -cat /user/$USER/wordcount/output/part-r-00000
```

Expected output:
```text
fun     1
hadoop  2
hello   2
is      1
world   1
```

## 16. Useful commands

```bash
hadoop version
jps
hdfs dfs -ls /
hdfs dfs -ls /user/$USER/wordcount/input
start-dfs.sh
start-yarn.sh
stop-yarn.sh
stop-dfs.sh
```

## Important notes

- Run the initial installation and XML configuration steps only once.
- On later sessions, start HDFS and YARN, then run your MapReduce job.
- Never delete APT/DPKG lock files manually.
- Never run `hdfs namenode -format` again on a cluster containing data you want to keep.
- If a command fails, resolve that error before proceeding to the next step.

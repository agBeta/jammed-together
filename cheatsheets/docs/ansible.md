# Ansible

Table of contents:
- [Installation](#installation)
- [Inventory](#inventory)
- [Best Practices](#best-practices)
  - [Content Organization (a.k.a Folder structure)](#content-organization)
- [Playbook Examples](#playbook-examples)
  - [reboot](#reboot)
  - [lineinfile (modify line a text file)](#lineinfile)
  - [blockinfile](#blockinfile)
  - [apt](#apt)

---

## Installation

For your **control node** (the machine that runs Ansible; e.g. the laptop), you can use nearly any UNIX-like machine with Python installed.

The **managed node** (the machine that Ansible is managing) **does not** require Ansible to be installed, **but requires Python** to run Ansible-generated Python code. The managed node also needs a user account that can connect through SSH to the node with an interactive POSIX shell.

(_based on [docs](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html#control-node-requirements)_)

We follow installation via `pip`. On your laptop:

```sh
python3 -m pip -V
```

if error `No module named pip`, you will need to install pip. Follow these steps:
```sh
sudo apt install python3-pip

# though you may not need it for ansible, but you will definitely need it for other python projects:
sudo apt install python3-venv
```

Side note: `venv` is included in python3 **standard** library. There are many virtual-environment-related tools. see [this SO](https://stackoverflow.com/a/41573588).

You may see [this link](https://www.redhat.com/en/blog/python-venv-ansible) to install ansible in virtualenv. **BUT** the [official installation](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html#pip-install) installs ansible for the current user using [`--user` flag](https://packaging.python.org/tutorials/installing-packages/#installing-to-the-user-site) of `pip` command and does NOT create any virtual environment.  
BTW, Note that the --user flag has **no effect** when inside a virtual environment.  

```sh
# for playing with ansible and testing
mkdir ansible
python3 -m venv env-ansible-test
cd env-ansible-test
source ./bin/activate
# now you should be inside the virtual env
>  python3 -V

# upgrade the preferred installer program (pip) inside your virtual environment:
> python3 -m pip install --upgrade pip

# install a specific version of ansible:
> python3 -m pip install ansible==11.4.0

# Alternatively you can use `pipreqs` package. see https://stackoverflow.com/q/31684375.
> pip3 freeze > requirements.txt 

> which ansible
# should print path to ansible installation in env-ansible-test folder.

> ansible --version
```

Once you're finished working inside your Python virtual environment run `deactivate`  .

(_from now we are mostly based on course videos_)

```sh
# use 'ping' module
> ansible -m ping localhost

> ansible -a "/bin/echo hi" localhost

> ansible -a "/usr/bin/hostname" localhost
# should print the name of laptop: e.g. Tim-asus

> ansible -m setup localhost
```

</br>

## Variables

_based on [Where to set variables](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_variables.html#where-to-set-variables)_

You can define variables in a variety of places, such as in inventory, in playbooks, in reusable files, in roles, and at the command line.

#### Defining variables in a play
You can define variables directly in a playbook play:
```yml
- hosts: webservers
  vars:
    http_port: 80
```

#### Defining variables in included files and roles

This separation enables you to store your playbooks in a source control software and even share the playbooks, without the risk of exposing passwords or other sensitive and personal data.

This example shows how you can include variables defined in an external file:
```yml
---
- hosts: all
  remote_user: root
  vars:
    favcolor: blue
  vars_files:
    - /vars/external_vars.yml

  tasks:

  - name: This is just a placeholder
    ansible.builtin.command: /bin/echo foo
```

The contents of each variables file is a simple YAML dictionary. In the above example, this would be `vars/external_vars.yml`:

```yml
---
somevar: somevalue
password: magic
```

See also [**Best Practices**](#best-practices) section.


</br>

## Inventory

Ansible automates tasks on managed nodes or “hosts” in your infrastructure, using a list or group of lists known as inventory.

The simplest inventory is a single file with a list of hosts and groups. The default location for this file is `/etc/ansible/hosts`.  
You can specify a different inventory source(s) at the command line using the `-i <path or expression>` option(s) or in using the configuration system.

If all hosts in a group share a variable value, you can apply that variable to an entire group at once:

```yaml
atlanta:
  hosts:
    host1:
    host2:
  vars:
    ntp_server: ntp.atlanta.example.com
    proxy: proxy.atlanta.example.com
```


</br>

## Best Practices

### Variables

read [Tips on where to set variables](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_variables.html#tips-on-where-to-set-variables)

### Content Organization 

a.k.a. Directory Layout or Folder Structure.

Approach 1 & 2 are based on [docs](https://docs.ansible.com/ansible/2.8/user_guide/playbooks_best_practices.html#content-organization).

See also [what this organization enables](https://docs.ansible.com/ansible/2.8/user_guide/playbooks_best_practices.html#what-this-organization-enables-examples).

#### Approach 1

Even if you use approach 2 (described a bit later), read this. Because some of naming & folder structure in approach 2 is identical to some parts of approach 1.

The top level of the directory would contain files and directories like so:

```sh
production        # inventory file for production servers
staging           # inventory file for staging environment

group_vars/
   group1.yml     # here we assign variables to particular groups
   group2.yml
host_vars/
   hostname1.yml  # here we assign variables to particular systems
   hostname2.yml

library/          # if any custom modules, put them here (optional)
module_utils/     # if any custom module_utils to support modules, put them here (optional)
filter_plugins/   # if any custom filter plugins, put them here (optional)

site.yml          # master playbook
webservers.yml    # playbook for webserver tier
dbservers.yml     # playbook for dbserver tier

roles/
    common/               # this hierarchy represents a "role"
        tasks/            #
            main.yml      #  <-- tasks file can include smaller files if warranted
        handlers/         #
            main.yml      #  <-- handlers file
        templates/        #  <-- files for use with the template resource
            ntp.conf.j2   #  <------- templates end in .j2
        files/            #
            bar.txt       #  <-- files for use with the copy resource
            foo.sh        #  <-- script files for use with the script resource
        vars/             #
            main.yml      #  <-- variables associated with this role
        defaults/         #
            main.yml      #  <-- default lower priority variables for this role
        meta/             #
            main.yml      #  <-- role dependencies
        library/          # roles can also include custom modules
        module_utils/     # roles can also include custom module_utils
        lookup_plugins/   # or other types of plugins, like lookup in this case

    webtier/              # same kind of structure as "common" was above, done for the webtier role
    monitoring/           # ""
    fooapp/               # ""

```

#### Approach 2

Alternatively, you can put each inventory file with its group_vars/host_vars in a separate directory. This is **particularly useful if** your `group_vars`/`host_vars` **don’t have** that much in **common** in different environments. The layout could look something like below.

This layout gives you more flexibility for larger environments, as well as a total separation of inventory variables between different environments. The downside is that it is harder to maintain, because there are more files.

```sh
inventories/
   production/
      hosts               # inventory file for production servers
      group_vars/
         group1.yml       # here we assign variables to particular groups
         group2.yml
      host_vars/
         hostname1.yml    # here we assign variables to particular systems
         hostname2.yml

   staging/
      hosts               # inventory file for staging environment
      group_vars/
         group1.yml       # here we assign variables to particular groups
         group2.yml
      host_vars/
         stagehost1.yml   # here we assign variables to particular systems
         stagehost2.yml

library/
module_utils/
filter_plugins/

site.yml
webservers.yml
dbservers.yml

roles/
    common/
    webtier/
    monitoring/
    fooapp/
```


</br>

## Playbook Examples

### [debug](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/debug_module.html)

```yml
- name: Print the gateway for each host when defined
  ansible.builtin.debug:
    msg: System {{ inventory_hostname }} has gateway {{ ansible_default_ipv4.gateway }}
  when: ansible_default_ipv4.gateway is defined


- name: Display all variables/facts known for a host
  ansible.builtin.debug:
    var: hostvars[inventory_hostname]
    verbosity: 4


- name: Prints two lines of messages, but ONLY IF there is an environment value set
  ansible.builtin.debug:
    msg:
    - "Provisioning based on YOUR_KEY which is: {{ lookup('ansible.builtin.env', 'YOUR_KEY') }}"
    - "These servers were built using the password of '{{ password_used }}'. Please retain this for later use."
```

---

### reboot

```yml
---
- name: reboot module demo
  hosts: all
  become: true
  tasks:
    - name: reboot host(s)
      ansible.builtin.reboot:
        msg: "reboot by Ansible"
        pre_reboot_delay: 5
        post_reboot_delay: 10
        test_command: "whoami"
```

If you have a task that needs to run after a reboot, you can do it with the [handler](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_handlers.html). It will just pick up where it left off on the next step. Like below. (based on Reddit)

```yml
    - name: reboot OS
      reboot:
        pre_reboot_delay: 5
        post_reboot_delay: 15
        reboot_timeout: 300
```

One thing to remember is that handlers always run in order of the handler file and NOT in the order they're called in your tasks. Also, if you have multiple tasks calling the same handler it **will only run once**. So, always keep the reboot first otherwise you tend to run into some edge cases where a service restart will cause an issue because it's waiting on something that a reboot is "loading" or doing. 

---

### lineinfile

```yml
- name: Ensure SELinux is set to enforcing mode
  ansible.builtin.lineinfile:
    path: /etc/selinux/config
    regexp: "^SELINUX="
    line: SELINUX=enforcing

- name: Add a line to a file if the **file** does not exist, without passing regexp
  ansible.builtin.lineinfile:
    path: /tmp/testfile
    line: 192.168.1.99 foo.lab.net foo
    create: yes


- name: Make sure group wheel is not in the sudoers configuration
  ansible.builtin.lineinfile:
    path: /etc/sudoers
    state: absent
    regexp: "^%wheel"


- name: Ensure the default Apache port is 8080
  ansible.builtin.lineinfile:
    path: /etc/httpd/conf/httpd.conf
    regexp: "^Listen "
    insertafter: "^#Listen "
    line: Listen 8080
```

---

### blockinfile

insert/update lines

```yml
- name: Insert/Update HTML surrounded by custom markers after <body> line
  ansible.builtin.blockinfile:
    path: /var/www/html/index.html
    marker: "<!-- {mark} ANSIBLE MANAGED BLOCK -->"
    insertafter: "<body>"
    block: |
      <h1>Welcome to {{ ansible_hostname }}</h1>
      <p>Last updated on {{ ansible_date_time.iso8601 }}</p>


- name: Remove HTML as well as surrounding markers
  ansible.builtin.blockinfile:
    path: /var/www/html/index.html
    marker: "<!-- {mark} ANSIBLE MANAGED BLOCK -->"
    block: ""


- name: Add mappings to /etc/hosts
  ansible.builtin.blockinfile:
    path: /etc/hosts
    block: |
      {{ item.ip }} {{ item.name }}
    marker: "# {mark} ANSIBLE MANAGED BLOCK {{ item.name }}"
  loop:
    - { name: host1, ip: 10.10.1.10 }
    - { name: host2, ip: 10.10.1.11 }
    - { name: host3, ip: 10.10.1.12 }
```

---

### cron

```yml
- name: Creates an entry like "0 5,2 * * ls -alh > /dev/null"
  ansible.builtin.cron:
    name: "check dirs"
    minute: "0"
    hour: "5,2"
    job: "ls -alh > /dev/null"
    # create a backup of the crontab before it is modified. The location of the backup is returned in the backup_file variable by this module. false is the default.
    backup: true

- name: Creates a cron file under /etc/cron.d
  ansible.builtin.cron:
    name: yum autoupdate
    weekday: "2"
    minute: "0"
    hour: "12"
    user: root
    job: "YUMINTERACTIVE=0 /usr/sbin/yum-autoupdate"
    cron_file: ansible_yum-autoupdate

- name: 'Ensure an old job is no longer present. Removes any job that is prefixed by "#Ansible: an old job" from the crontab'
  ansible.builtin.cron:
    name: "an old job"
    state: absent
```

---


### [apt](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/apt_module.html)

```yml
- name: Update repositories cache and install "foo" package
  ansible.builtin.apt:
    name: foo
    update_cache: yes


- name: Install a .deb package
  ansible.builtin.apt:
    deb: /tmp/mypackage.deb


- name: Remove dependencies that are no longer required and purge their configuration files
  ansible.builtin.apt:
    autoremove: yes
    purge: true

- name: Run the equivalent of "apt-get clean" as a separate step
  ansible.builtin.apt:
    clean: yes
```

---

### git

clone using ssh

```yml
---
- name: git module demo
  hosts: all
  vars:
    repo: "git@github.com:lucab85/ansible-pilot.git"
    dest: "/home/devops/ansible-pilot"
    # private key file path, on the target host, to use for the checkout.
    sshkey: "~/.ssh/id_rsa"
  tasks:
    - name: ensure git pkg installed
      # you should use apt for ubuntu
      ansible.builtin.yum:
        name: git
        state: present
        update_cache: true
      become: true

    - name: checkout git repo
      ansible.builtin.git:
        repo: "{{ repo }}"
        dest: "{{ dest }}"
        key_file: "{{ sshkey }}"
        # see Note 1 and 2 [not tested]
        accept_newhostkey: true
        ssh_options: "-o StrictHostKeyChecking=accept-new"


    - name: checkout a specific version and bare and use refspec to fetch all pull requests
      ansible.builtin.git:
        repo: 'https://github.com/ansible/ansible.git'
        dest: /tmp/checkout
        # can be the literal string HEAD, a branch name, a tag name. It can also be a SHA-1 hash, in which case refspec needs to be specified if the given revision is not already available.
        version: release-0.22
        bare: true
        # change this to actual useful refs so that the bare clone works correctly.
        refspec: '+refs/pull/*:refs/heads/*'

```

**Note 1**: if the task seems to be **hanging**, first verify remote host is in `known_hosts`. SSH will prompt user to authorize the **first contact** with a remote host. To avoid this prompt, one solution is to use the option `accept_hostkey` (or `accept_newhostkey` for more security against MITM ?).   
Another solution is to add the remote host public key in /etc/ssh/ssh_known_hosts before calling the git module, with the following command: 
```sh
ssh-keyscan -H remote_host.com >> /etc/ssh/ssh_known_hosts.
```

Note 2: As of OpenSSH 7.5, `-o StrictHostKeyChecking=accept-new` can be used which is safer and will only accepts host keys which are not present or are the same. If true, **ensure that** -o StrictHostKeyChecking=accept-new is present as an ssh option.

---

### copy


```yml
---
- name: copy module demo
  hosts: all
  become: false
  tasks:
    - name: copy report.txt
      ansible.builtin.copy:
        src: report.txt
        dest: /home/devops/report.txt
        owner: devops
        mode: '0644'
```

---

### service

prints list of services on the target.

```yml
- name: Populate service facts
  ansible.builtin.service_facts:
  # empty. Populates special variable 'ansible_facts.services'

- name: Print service facts
  ansible.builtin.debug:
    var: ansible_facts.services


- name: show names of existing systemd services.
  debug: msg={{ existing_systemd_services | map(attribute='name') }}
  vars:
     known_systemd_services: "{{ ansible_facts['services'].values() | selectattr('source', 'equalto', 'systemd') }}"
     existing_systemd_services: "{{ known_systemd_services | rejectattr('status', 'equalto', 'not-found') }}"
    # btw, why reject 'not-found'? sometimes systemd knows about services that were never installed !

```

Now, we know about `service_facts` module, let's use it in conjunction with `service` module to work with services.

```yml
---
- name: service module demo
  hosts: all
  become: true
  vars:
    services_to_disable:
      - "chronyd.service"
  tasks:
    - name: populate service facts
      ansible.builtin.service_facts:


    - name: Start service httpd, if not started
      ansible.builtin.service:
        name: httpd
        state: started


    - name: disable some services
      ansible.builtin.service:
        name: "{{ item }}"
        enabled: false
        state: stopped
      when: "item in services"
      with_items: '{{ services_to_disable }}'
```

---

### stat

```yml
---
- name: check if a file exist
  hosts: all
  become: false
  vars:
    file_path: /home/devops/test.txt
  tasks:
    - name: check if a file exists
      ansible.builtin.stat:
        path: "{{ file_path }}"
      register: file_data

    - name: report file NOT exists
      ansible.builtin.debug:
        msg: "The file {{ file_path }} doesn't exist"
      when: not file_data.stat.exists
```


---

## Ansible Vault

``` yml
# ./secrets.yml
---
db_pass: secret_password123


# ./playbook-with-vault.yml
---
- name: Setup Wordpress webserver
  hosts: all
  tasks:
    - name: include db_pass from vault
      ansible.builtin.include_vars:
        file: secrets.yml
    
    - name: print variables
      ansible.builtin.debug:
        var: db_pass
```

Now in terminal, let's first encrypt clear-text `secrets.yml` file using ansible-vault.
```sh
ansible-vault encrypt secrets.yml
# enter new vault password

cat secrets.yml
# the content should be encrypted now

ansible-playbook -i inventory.yml --ask-vault-password playbook-with-vault.yml
# enter the vault password
```

---

## Roles

While automation tasks can be written exclusively in an Ansible Playbook, Ansible Roles allow you to create bundles of automation content that can be run in 1 or more plays, reused across playbooks, and shared with other users in collections.

By default, Ansible looks for roles in the following locations (based on [docs](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_reuse_roles.html#storing-and-finding-roles)):
- in collections, if you are using them
- in a directory called `roles/`, **relative** to the playbook file
- in the configured roles_path. The default search path is `~/.ansible/roles:/usr/share/ansible/roles:/etc/ansible/roles`.
- in the directory where the playbook file is located

The example in Edureka's youtube video is based on the third location. So you can:

```sh
cd /etc/ansible
sudo ansible-galaxy init prerequisite
sudo ansible-galaxy init mongo

cd prerequisite/tasks
sudo nano --nowrap main.yml
```

However, examples in ansible roles docs is based the second location.

Note, using `ansible-galaxy` _seems_ optional; apparently it just scaffolds the necessary [folder structure](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_reuse_roles.html). The ansible docs doesn't use it for its example.

You can add other YAML files in some directories, but they won’t be used by default. They can be included/imported directly or specified when using `include_role`/`import_role`. For example, you can place platform-specific tasks in separate files and refer to them in the `tasks/main.yml` file:

```yml
# roles/example/tasks/main.yml
- name: Install the correct web server for RHEL
  import_tasks: redhat.yml
  when: ansible_facts['os_family']|lower == 'redhat'

- name: Install the correct web server for Debian
  import_tasks: debian.yml
  when: ansible_facts['os_family']|lower == 'debian'

# roles/example/tasks/redhat.yml
- name: Install web server
  ansible.builtin.yum:
    name: "httpd"
    state: present

# roles/example/tasks/debian.yml
- name: Install web server
  ansible.builtin.apt:
    name: "apache2"
    state: present
```

### Using roles

You can use roles in the following ways:

- at the play level with the roles option: This is the classic way of using roles in a play.  
Btw, The advantage of `roles` is that you can _recursively_ execute `dependencies` (based on [role dependency docs](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_reuse_roles.html#using-role-dependencies)).

  Example:

  ```yml
  ---
  - hosts: webservers
    roles:
      - common
      - role: foo_app_instance
        vars:
          dir: '/opt/a'
          app_port: 5000
        tags: typeA
      - role: foo_app_instance
        vars:
          dir: '/opt/b'
          app_port: 5001
        tags: typeB
        # Note: When you add a tag to the role option, Ansible applies the tag to **ALL** tasks within the role.
  ```

- at the tasks level with `include_role`: You can reuse roles **dynamically** anywhere in the tasks section of a play using include_role.  
While roles added in a `roles` section run _before any other tasks_ in a play, included roles (via `include_role`) _run in the order_ they are defined. If there are other tasks before an include_role task, the other tasks will run first.    
_(based on [Including roles: dynamic reuse](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_reuse_roles.html#including-roles-dynamic-reuse))_

- at the tasks level with `import_role`: You can reuse roles **statically** anywhere in the tasks section of a play using import_role.

Example of dynamic reuse via `include_role`:

```yml
---
- hosts: webservers
  tasks:
    - name: Print a message
      ansible.builtin.debug:
        msg: "this task runs before the example role"

    - name: Include the example role
      include_role:
        name: example

    # conditionally include a role
    - name: Include the some_role role
      include_role:
        name: some_role
      when: "ansible_facts['os_family'] == 'RedHat'"

    - name: Include the foo_app_instance role
      include_role:
        name: foo_app_instance
      vars:
        dir: '/opt/a'
        app_port: 5000
      tags: typeA
```

_BTW_, To run only tasks and blocks tagged either 'configuration' or 'packages' in a very long playbook:

 ```sh
ansible-playbook example.yml --tags "configuration,packages"
 ```

To run all tasks **except** those tagged packages:
```sh
ansible-playbook example.yml --skip-tags "packages"
```

 (_based on [tags docs](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_tags.html#selecting-or-skipping-tags-when-you-run-a-playbook)_)


### Role Dependency

_based on [docs](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_reuse_roles.html#using-role-dependencies)_

Role dependencies are stored in the `meta/main.yml` file within the role directory.

```yml
# roles/myapp/meta/main.yml
---
dependencies:
  - role: common
    vars:
      some_parameter: 3
  - role: apache
    vars:
      apache_port: 80
  - role: postgres
    vars:
      dbname: blarg
      other_parameter: 12
```

---

</br>

## Testing

_(based on [docs](https://docs.ansible.com/ansible/latest/reference_appendices/test_strategies.html))_

## Other

- `ansible-playbook --check --diff -i ...`: dry-run and see the changes without actually performing / modifying anything.

- `ansible-playbook -i ../inventory.yml playbook.yml -vv` : that double `vv` means verbosity level=2. you can specify verbosity level when using `debug` module.



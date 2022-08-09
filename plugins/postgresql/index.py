# coding:utf-8

import sys
import io
import os
import time
import subprocess
import re
import json


# reload(sys)
# sys.setdefaultencoding('utf-8')

sys.path.append(os.getcwd() + "/class/core")
import mw


if mw.isAppleSystem():
    cmd = 'ls /usr/local/lib/ | grep python  | cut -d \\  -f 1 | awk \'END {print}\''
    info = mw.execShell(cmd)
    p = "/usr/local/lib/" + info[0].strip() + "/site-packages"
    sys.path.append(p)


app_debug = False
if mw.isAppleSystem():
    app_debug = True


def getPluginName():
    return 'postgresql'


def getPluginDir():
    return mw.getPluginDir() + '/' + getPluginName()


def getServerDir():
    return mw.getServerDir() + '/' + getPluginName()


def getInitDFile():
    if app_debug:
        return '/tmp/' + getPluginName()
    return '/etc/init.d/' + getPluginName()


def getArgs():
    args = sys.argv[2:]

    tmp = {}
    args_len = len(args)

    if args_len == 1:
        t = args[0].strip('{').strip('}')
        t = t.split(':')
        tmp[t[0]] = t[1]
    elif args_len > 1:
        for i in range(len(args)):
            t = args[i].split(':')
            tmp[t[0]] = t[1]

    return tmp


def checkArgs(data, ck=[]):
    for i in range(len(ck)):
        if not ck[i] in data:
            return (False, mw.returnJson(False, '参数:(' + ck[i] + ')没有!'))
    return (True, mw.returnJson(True, 'ok'))


def getConf():
    path = getServerDir() + '/data/postgresql.conf'
    return path


def configTpl():

    clist = []

    app_dir = getServerDir()
    clist.append(app_dir + "/data/postgresql.conf")
    clist.append(app_dir + "/data/pg_hba.conf")

    return mw.getJson(clist)


def pgHbaConf():
    return getServerDir() + "/data/pg_hba.conf"


def readConfigTpl():
    args = getArgs()
    data = checkArgs(args, ['file'])
    if not data[0]:
        return data[1]

    content = mw.readFile(args['file'])
    return mw.returnJson(True, 'ok', content)


def getDbPort():
    file = getConf()
    content = mw.readFile(file)
    rep = 'port\s*=\s*(\d*)?'
    tmp = re.search(rep, content)
    return tmp.groups()[0].strip()


def getSocketFile():
    file = getConf()
    content = mw.readFile(file)
    rep = 'socket\s*=\s*(.*)'
    tmp = re.search(rep, content)
    return tmp.groups()[0].strip()


def getInitdTpl(version=''):
    path = getPluginDir() + '/init.d/postgresql.tpl'
    if not os.path.exists(path):
        path = getPluginDir() + '/init.d/postgresql.tpl'
    return path


def contentReplace(content):
    service_path = mw.getServerDir()
    content = content.replace('{$ROOT_PATH}', mw.getRootDir())
    content = content.replace('{$SERVER_PATH}', service_path)
    content = content.replace('{$APP_PATH}', service_path + '/postgresql')
    return content


def pSqliteDb(dbname='databases'):
    file = getServerDir() + '/pgsql.db'
    name = 'pgsql'
    if not os.path.exists(file):
        conn = mw.M(dbname).dbPos(getServerDir(), name)
        csql = mw.readFile(getPluginDir() + '/conf/pgsql.sql')
        csql_list = csql.split(';')
        for index in range(len(csql_list)):
            conn.execute(csql_list[index], ())
    else:
        # 现有run
        # conn = mw.M(dbname).dbPos(getServerDir(), name)
        # csql = mw.readFile(getPluginDir() + '/conf/mysql.sql')
        # csql_list = csql.split(';')
        # for index in range(len(csql_list)):
        #     conn.execute(csql_list[index], ())
        conn = mw.M(dbname).dbPos(getServerDir(), name)
    return conn


def pgDb():

    sys.path.append(getPluginDir() + "/class")
    import pg

    db = pg.ORM()

    db.setPort(getDbPort())
    # db.setSocket(getSocketFile())
    db.setPwd(pSqliteDb('config').where('id=?', (1,)).getField('pg_root'))
    return db


def initDreplace(version=''):

    conf_dir = getServerDir()
    conf_list = [
        conf_dir + "/logs",
        conf_dir + "/tmp",
    ]
    for c in conf_list:
        if not os.path.exists(c):
            os.mkdir(c)

    init_pl = conf_dir + "/init.pl"
    if not os.path.exists(init_pl):
        mw.writeFile(init_pl, 'ok')
        pg_conf = conf_dir + '/data/postgresql.conf'
        tpl = getPluginDir() + '/conf/postgresql.conf'
        content = mw.readFile(tpl)
        content = contentReplace(content)
        mw.writeFile(pg_conf, content)

        logfile = runLog()
        if not os.path.exists(logfile):
            mw.writeFile(logfile, '')

    # systemd
    system_dir = mw.systemdCfgDir()
    service = system_dir + '/postgresql.service'
    if os.path.exists(system_dir) and not os.path.exists(service):
        tpl = getPluginDir() + '/init.d/postgresql.service.tpl'
        service_path = mw.getServerDir()
        content = mw.readFile(tpl)
        content = contentReplace(content)
        mw.writeFile(service, content)
        mw.execShell('systemctl daemon-reload')

    if not mw.isAppleSystem():
        mw.execShell('chown -R postgresql:postgresql ' + getServerDir())

    initd_path = getServerDir() + '/init.d'
    if not os.path.exists(initd_path):
        os.mkdir(initd_path)

    file_bin = initd_path + '/' + getPluginName()
    if not os.path.exists(file_bin):
        tpl = getInitdTpl(version)
        content = mw.readFile(tpl)
        content = contentReplace(content)
        mw.writeFile(file_bin, content)
        mw.execShell('chmod +x ' + file_bin)
    return file_bin


def status(version=''):
    data = mw.execShell(
        "ps -ef|grep postgres |grep -v grep | grep -v python | grep -v mdserver-web | awk '{print $2}'")
    if data[0] == '':
        return 'stop'
    return 'start'


def pGetDbUser():
    if mw.isAppleSystem():
        user = mw.execShell(
            "who | sed -n '2, 1p' |awk '{print $1}'")[0].strip()
        return user
    return 'postgresql'


def initPgData():
    serverdir = getServerDir()
    if not os.path.exists(serverdir + '/data'):
        cmd = serverdir + '/bin/initdb -D ' + serverdir + "/data"
        if not mw.isAppleSystem():
            cmd = "echo \"" + serverdir + "/bin/initdb -D " + \
                serverdir + "/data\" | su - postgresql"
        # print(cmd)
        mw.execShell(cmd)
        return False
    return True


def initPgPwd():

    serverdir = getServerDir()
    pwd = mw.getRandomString(16)

    cmd_pass = "echo \"create user root with superuser password '" + pwd + "'\" | "
    cmd_pass = cmd_pass + serverdir + '/bin/psql -d postgres'
    data = mw.execShell(cmd_pass)
    # print(cmd_pass)
    # print(data)

    pSqliteDb('config').where('id=?', (1,)).save('pg_root', (pwd,))
    return True


def pgOp(version, method):
    # import commands
    init_file = initDreplace()
    cmd = init_file + ' ' + method
    # print(cmd)
    try:
        isInited = initPgData()
        if not isInited:
            if mw.isAppleSystem():
                cmd_init_start = init_file + ' start'
                subprocess.Popen(cmd_init_start, stdout=subprocess.PIPE, shell=True,
                                 bufsize=4096, stderr=subprocess.PIPE)

                time.sleep(6)
            else:
                mw.execShell('systemctl start postgresql')

            initPgPwd()

            if mw.isAppleSystem():
                cmd_init_stop = init_file + ' stop'
                subprocess.Popen(cmd_init_stop, stdout=subprocess.PIPE, shell=True,
                                 bufsize=4096, stderr=subprocess.PIPE)
                time.sleep(3)
            else:
                mw.execShell('systemctl stop postgresql')

        if mw.isAppleSystem():
            sub = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=True,
                                   bufsize=4096, stderr=subprocess.PIPE)
            sub.wait(5)
        else:
            mw.execShell('systemctl ' + method + ' postgresql')
        return 'ok'
    except Exception as e:
        # raise
        return method + ":" + str(e)


def appCMD(version, action):
    return pgOp(version, action)


def start(version=''):
    return appCMD(version, 'start')


def stop(version=''):
    return appCMD(version, 'stop')


def restart(version=''):
    return appCMD(version, 'restart')


def reload(version=''):
    logfile = runLog()
    if os.path.exists(logfile):
        mw.writeFile(logfile, '')
    return appCMD(version, 'reload')


def initdStatus():
    if mw.isAppleSystem():
        return "Apple Computer does not support"

    shell_cmd = 'systemctl status postgresql | grep loaded | grep "enabled;"'
    data = mw.execShell(shell_cmd)
    if data[0] == '':
        return 'fail'
    return 'ok'


def initdInstall():
    if mw.isAppleSystem():
        return "Apple Computer does not support"

    mw.execShell('systemctl enable postgresql')
    return 'ok'


def initdUinstall():
    if mw.isAppleSystem():
        return "Apple Computer does not support"

    mw.execShell('systemctl disable postgresql')
    return 'ok'


def getMyDbPos():
    file = getConf()
    content = mw.readFile(file)
    rep = 'datadir\s*=\s*(.*)'
    tmp = re.search(rep, content)
    return tmp.groups()[0].strip()


def setPgDbPos():
    args = getArgs()
    data = checkArgs(args, ['datadir'])
    if not data[0]:
        return data[1]

    s_datadir = getMyDbPos()
    t_datadir = args['datadir']
    if t_datadir == s_datadir:
        return mw.returnJson(False, '与当前存储目录相同，无法迁移文件!')

    if not os.path.exists(t_datadir):
        mw.execShell('mkdir -p ' + t_datadir)

    # mw.execShell('/etc/init.d/mysqld stop')
    stop()
    mw.execShell('cp -rf ' + s_datadir + '/* ' + t_datadir + '/')
    mw.execShell('chown -R mysql mysql ' + t_datadir)
    mw.execShell('chmod -R 755 ' + t_datadir)
    mw.execShell('rm -f ' + t_datadir + '/*.pid')
    mw.execShell('rm -f ' + t_datadir + '/*.err')

    path = getServerDir()
    myfile = path + '/etc/my.cnf'
    mycnf = mw.readFile(myfile)
    mw.writeFile(path + '/etc/my_backup.cnf', mycnf)

    mycnf = mycnf.replace(s_datadir, t_datadir)
    mw.writeFile(myfile, mycnf)
    start()

    result = mw.execShell(
        'ps aux|grep mysqld| grep -v grep|grep -v python')
    if len(result[0]) > 10:
        mw.writeFile('data/datadir.pl', t_datadir)
        return mw.returnJson(True, '存储目录迁移成功!')
    else:
        mw.execShell('pkill -9 mysqld')
        mw.writeFile(myfile, mw.readFile(path + '/etc/my_backup.cnf'))
        start()
        return mw.returnJson(False, '文件迁移失败!')


def getPgPort():
    file = getConf()
    content = mw.readFile(file)
    rep = 'port\s*=\s*(.*)'
    tmp = re.search(rep, content)
    return tmp.groups()[0].strip()


def setPgPort():
    args = getArgs()
    data = checkArgs(args, ['port'])
    if not data[0]:
        return data[1]

    port = args['port']
    file = getConf()
    content = mw.readFile(file)
    rep = "port\s*=\s*([0-9]+)\s*\n"
    content = re.sub(rep, 'port = ' + port + '\n', content)
    mw.writeFile(file, content)
    restart()
    return mw.returnJson(True, '编辑成功!')


def runInfo():

    if status(version) == 'stop':
        return mw.returnJson(False, 'PG未启动', [])

    db = pgDb()
    # data = db.query('show global status')
    data_directory = getServerDir() + "/data"
    port = getPgPort()
    result = {}

    result['uptime'] = mw.execShell(
        '''cat {}/postmaster.pid |sed -n 3p '''.format(data_directory))[0]
    timestamp = result['uptime']
    time_local = time.localtime(int(timestamp))
    dt = time.strftime("%Y-%m-%d %H:%M:%S", time_local)
    result['uptime'] = dt

    result['progress_num'] = mw.execShell(
        "ps -ef |grep postgres |wc -l")[0].strip()
    result['pid'] = mw.execShell(
        '''cat {}/postmaster.pid |sed -n 1p '''.format(data_directory))[0].strip()
    res = db.query(
        'SELECT count(*) FROM pg_stat_activity WHERE NOT pid=pg_backend_pid()')
    result['connections'] = res[0][0]

    res = db.query("select pg_size_pretty(pg_database_size('postgres'))")
    result['pg_size'] = res[0][0]
    result['pg_mem'] = mw.execShell(
        '''cat /proc/%s/status|grep VmRSS|awk -F: '{print $2}' ''' % (result['pid']))[0]

    result['pg_vm_lock'] = mw.execShell(
        '''cat /proc/%s/status|grep VmLck|awk -F: '{print $2}'  ''' % (result['pid'].strip()))[0]
    result['pg_vm_high'] = mw.execShell(
        '''cat /proc/%s/status|grep VmHWM|awk -F: '{print $2}'  ''' % (result['pid'].strip()))[0]
    result['pg_vm_data_size'] = mw.execShell(
        '''cat /proc/%s/status|grep VmData|awk -F: '{print $2}'  ''' % (result['pid'].strip()))[0]
    result['pg_vm_sk_size'] = mw.execShell(
        '''cat /proc/%s/status|grep VmStk|awk -F: '{print $2}'  ''' % (result['pid'].strip()))[0]
    result['pg_vm_code_size'] = mw.execShell(
        '''cat /proc/%s/status|grep VmExe|awk -F: '{print $2}'  ''' % (result['pid'].strip()))[0]
    result['pg_vm_lib_size'] = mw.execShell(
        '''cat /proc/%s/status|grep VmLib|awk -F: '{print $2}'  ''' % (result['pid'].strip()))[0]
    result['pg_vm_swap_size'] = mw.execShell(
        '''cat /proc/%s/status|grep VmSwap|awk -F: '{print $2}'  ''' % (result['pid'].strip()))[0]
    result['pg_vm_page_size'] = mw.execShell(
        '''cat /proc/%s/status|grep VmPTE|awk -F: '{print $2}'  ''' % (result['pid'].strip()))[0]
    result['pg_sigq'] = mw.execShell(
        '''cat /proc/%s/status|grep SigQ|awk -F: '{print $2}'  ''' % (result['pid'].strip()))[0]

    return mw.getJson(result)


def runLog():
    return getServerDir() + "/logs/server.log"


def getSlowLog():
    # pgsql慢日志查询
    return getServerDir() + "/logs/" + time.strftime("postgresql-%Y-%m-%d.log")


def getUnit(args):
    unit = ''
    if "GB" in args:
        unit = "GB"
    elif "MB" in args:
        unit = "MB"
    elif "KB" in args:
        unit = "KB"
    elif "kB" in args:
        unit = "kB"
    return unit


def pgDbStatus():

    data_directory = getServerDir() + "/data"
    data = {}
    shared_buffers, work_mem, effective_cache_size, maintence_work_mem, max_connections, temp_buffers, max_prepared_transactions, max_stack_depth, bgwriter_lru_maxpages, max_worker_processes, listen_addresses = '', '', '', '', '', '', '', '', '', '', ''
    with open("{}/postgresql.conf".format(data_directory)) as f:
        for i in f:
            if i.strip().startswith("shared_buffers"):
                shared_buffers = i.split("=")[1]
            elif i.strip().startswith("#shared_buffers"):
                shared_buffers = i.split("=")[1]

            shared_buffers_num = re.match(
                r'\d+', shared_buffers.strip()).group() if re.match(r'\d+', shared_buffers.strip()) else ""
            data['shared_buffers'] = [shared_buffers_num, "MB",
                                      "PG通过shared_buffers和内核和磁盘打交道，通常设置为实际内存的10％."]

            if i.strip().startswith("work_mem"):
                work_mem = i.split("=")[1]
            elif i.strip().startswith("#work_mem"):
                work_mem = i.split("=")[1]

            work_mem_num = re.match(
                r'\d+', work_mem.strip()).group() if re.match(r'\d+', work_mem.strip()) else ""
            data['work_mem'] = [work_mem_num, "MB",
                                "增加work_mem有助于提高排序的速度。通常设置为实际RAM的2% -4%."]

            if i.strip().startswith("effective_cache_size"):
                effective_cache_size = i.split("=")[1]
            elif i.strip().startswith("#effective_cache_size"):
                effective_cache_size = i.split("=")[1]

            effective_cache_size_num = re.match(r'\d+', effective_cache_size.strip(
            )).group() if re.match(r'\d+', effective_cache_size.strip()) else ""
            data['effective_cache_size'] = [effective_cache_size_num,
                                            "GB", "PG能够使用的最大缓存,比如4G的内存，可以设置为3GB."]

            if i.strip().startswith("temp_buffers "):
                temp_buffers = i.split("=")[1]
            elif i.strip().startswith("#temp_buffers "):
                temp_buffers = i.split("=")[1]

            temp_buffers_num = re.match(
                r'\d+', temp_buffers.strip()).group() if re.match(r'\d+', temp_buffers.strip()) else ""
            data['temp_buffers'] = [temp_buffers_num, "MB",
                                    "设置每个数据库会话使用的临时缓冲区的最大数目，默认是8MB"]

            if i.strip().startswith("max_connections"):
                max_connections = i.split("=")[1]
            elif i.strip().startswith("#max_connections"):
                max_connections = i.split("=")[1]

            max_connections_num = re.match(
                r'\d+', max_connections.strip()).group() if re.match(r'\d+', max_connections.strip()) else ""
            data['max_connections'] = [max_connections_num,
                                       getUnit(max_connections), "最大连接数"]

            if i.strip().startswith("max_prepared_transactions"):
                max_prepared_transactions = i.split("=")[1]
            elif i.strip().startswith("#max_prepared_transactions"):
                max_prepared_transactions = i.split("=")[1]

            max_prepared_transactions_num = re.match(r'\d+', max_prepared_transactions.strip(
            )).group() if re.match(r'\d+', max_prepared_transactions.strip()) else ""
            data['max_prepared_transactions'] = [max_prepared_transactions_num, getUnit(
                max_prepared_transactions), "设置可以同时处于 prepared 状态的事务的最大数目"]

            if i.strip().startswith("max_stack_depth "):
                max_stack_depth = i.split("=")[1]
            elif i.strip().startswith("#max_stack_depth "):
                max_stack_depth = i.split("=")[1]

            max_stack_depth_num = re.match(
                r'\d+', max_stack_depth.strip()).group() if re.match(r'\d+', max_stack_depth.strip()) else ""
            data['max_stack_depth'] = [max_stack_depth_num,
                                       "MB", "指定服务器的执行堆栈的最大安全深度，默认是2MB"]

            if i.strip().startswith("bgwriter_lru_maxpages "):
                bgwriter_lru_maxpages = i.split("=")[1]
            elif i.strip().startswith("#bgwriter_lru_maxpages "):
                bgwriter_lru_maxpages = i.split("=")[1]

            bgwriter_lru_maxpages_num = re.match(r'\d+', bgwriter_lru_maxpages.strip(
            )).group() if re.match(r'\d+', bgwriter_lru_maxpages.strip()) else ""
            data['bgwriter_lru_maxpages'] = [
                bgwriter_lru_maxpages_num, "", "一个周期最多写多少脏页"]

            if i.strip().startswith("max_worker_processes "):
                max_worker_processes = i.split("=")[1]
            elif i.strip().startswith("#max_worker_processes "):
                max_worker_processes = i.split("=")[1]

            max_worker_processes_num = re.match(r'\d+', max_worker_processes.strip(
            )).group() if re.match(r'\d+', max_worker_processes.strip()) else ""
            data['max_worker_processes'] = [max_worker_processes_num,
                                            "", "如果要使用worker process, 最多可以允许fork 多少个worker进程."]

            # if i.strip().startswith("listen_addresses"):
            #     listen_addresses = i.split("=")[1]
            # elif i.strip().startswith("#listen_addresses"):
            #     listen_addresses = i.split("=")[1]

            # listen_addresses = re.match(r"\'.*?\'", listen_addresses.strip()).group(
            # ) if re.match(r"\'.*?\'", listen_addresses.strip()) else ""
            # data['listen_addresses'] = [listen_addresses.replace(
            #     "'", '').replace("127.0.0.1", 'localhost'), "", "pgsql监听地址"]

    # 返回数据到前端
    data['status'] = True
    return mw.getJson(data)


def sedConf(name, val):
    path = getServerDir() + "/data/postgresql.conf"
    content = ''
    with open(path) as f:
        for i in f:
            if i.strip().startswith(name):
                i = "{} = {} \n".format(name, val)
            content += i

    mw.writeFile(path, content)
    return True


def pgSetDbStatus():
    ''' 
    保存pgsql性能调整信息
    '''
    args = getArgs()
    data = checkArgs(args, ['shared_buffers', 'work_mem', 'effective_cache_size',
                            'temp_buffers', 'max_connections', 'max_prepared_transactions',
                            'max_stack_depth', 'bgwriter_lru_maxpages', 'max_worker_processes'])
    if not data[0]:
        return data[1]

    for k, v in args.items():
        sedConf(k, v)

    restart()
    return mw.returnJson(True, '设置成功!')


def __createUser(dbname, username, password, address):
    pdb = pMysqlDb()

    if username == 'root':
        dbname = '*'

    pdb.execute(
        "CREATE USER `%s`@`localhost` IDENTIFIED BY '%s'" % (username, password))
    pdb.execute(
        "grant all privileges on %s.* to `%s`@`localhost`" % (dbname, username))
    for a in address.split(','):
        pdb.execute(
            "CREATE USER `%s`@`%s` IDENTIFIED BY '%s'" % (username, a, password))
        pdb.execute(
            "grant all privileges on %s.* to `%s`@`%s`" % (dbname, username, a))
    pdb.execute("flush privileges")


def getDbBackupListFunc(dbname=''):
    bkDir = mw.getRootDir() + '/backup/database'
    blist = os.listdir(bkDir)
    r = []

    bname = 'db_' + dbname
    blen = len(bname)
    for x in blist:
        fbstr = x[0:blen]
        if fbstr == bname:
            r.append(x)
    return r


def setDbBackup():
    args = getArgs()
    data = checkArgs(args, ['name'])
    if not data[0]:
        return data[1]

    scDir = getPluginDir() + '/scripts/backup.py'
    cmd = 'python3 ' + scDir + ' database ' + args['name'] + ' 3'
    os.system(cmd)
    return mw.returnJson(True, 'ok')


def importDbBackup():
    args = getArgs()
    data = checkArgs(args, ['file', 'name'])
    if not data[0]:
        return data[1]

    file = args['file']
    name = args['name']

    file_path = mw.getRootDir() + '/backup/database/' + file
    file_path_sql = mw.getRootDir() + '/backup/database/' + file.replace('.gz', '')

    if not os.path.exists(file_path_sql):
        cmd = 'cd ' + mw.getRootDir() + '/backup/database && gzip -d ' + file
        mw.execShell(cmd)

    pwd = pSqliteDb('config').where('id=?', (1,)).getField('pg_root')

    mysql_cmd = mw.getRootDir() + '/server/mysql/bin/mysql -uroot -p' + pwd + \
        ' ' + name + ' < ' + file_path_sql

    # print(mysql_cmd)
    os.system(mysql_cmd)
    return mw.returnJson(True, 'ok')


def deleteDbBackup():
    args = getArgs()
    data = checkArgs(args, ['filename'])
    if not data[0]:
        return data[1]

    bkDir = mw.getRootDir() + '/backup/database'

    os.remove(bkDir + '/' + args['filename'])
    return mw.returnJson(True, 'ok')


def getDbBackupList():
    args = getArgs()
    data = checkArgs(args, ['name'])
    if not data[0]:
        return data[1]

    r = getDbBackupListFunc(args['name'])
    bkDir = mw.getRootDir() + '/backup/database'
    rr = []
    for x in range(0, len(r)):
        p = bkDir + '/' + r[x]
        data = {}
        data['name'] = r[x]

        rsize = os.path.getsize(p)
        data['size'] = mw.toSize(rsize)

        t = os.path.getctime(p)
        t = time.localtime(t)

        data['time'] = time.strftime('%Y-%m-%d %H:%M:%S', t)
        rr.append(data)

        data['file'] = p

    return mw.returnJson(True, 'ok', rr)


def getDbList():
    args = getArgs()
    page = 1
    page_size = 10
    search = ''
    data = {}
    if 'page' in args:
        page = int(args['page'])

    if 'page_size' in args:
        page_size = int(args['page_size'])

    if 'search' in args:
        search = args['search']

    conn = pSqliteDb('databases')
    limit = str((page - 1) * page_size) + ',' + str(page_size)
    condition = ''
    if not search == '':
        condition = "name like '%" + search + "%'"
    field = 'id,pid,name,username,password,accept,rw,ps,addtime'
    clist = conn.where(condition, ()).field(
        field).limit(limit).order('id desc').select()

    for x in range(0, len(clist)):
        dbname = clist[x]['name']
        blist = getDbBackupListFunc(dbname)
        # print(blist)
        clist[x]['is_backup'] = False
        if len(blist) > 0:
            clist[x]['is_backup'] = True

    count = conn.where(condition, ()).count()
    _page = {}
    _page['count'] = count
    _page['p'] = page
    _page['row'] = page_size
    _page['tojs'] = 'dbList'
    data['page'] = mw.getPage(_page)
    data['data'] = clist

    info = {}
    info['root_pwd'] = pSqliteDb('config').where(
        'id=?', (1,)).getField('pg_root')
    data['info'] = info

    return mw.getJson(data)


def syncGetDatabases():
    pdb = pgDb()
    psdb = pSqliteDb('databases')
    data = pdb.table('pg_database').field(
        'datname').where("datistemplate=false").select()
    nameArr = ['postgres', ]
    n = 0

    # print(users)
    for value in data:
        vdb_name = value["datname"]
        b = False
        for key in nameArr:
            if vdb_name == key:
                b = True
                break
        if b:
            continue
        if psdb.where("name=?", (vdb_name,)).count() > 0:
            continue
        host = '127.0.0.1'
        # for user in users:
        #     if vdb_name == user["User"]:
        #         host = user["Host"]
        #         break

        ps = mw.getMsg('INPUT_PS')
        addTime = time.strftime('%Y-%m-%d %X', time.localtime())
        if psdb.add('name,username,password,accept,ps,addtime', (vdb_name, vdb_name, '', host, ps, addTime)):
            n += 1

    msg = mw.getInfo('本次共从服务器获取了{1}个数据库!', (str(n),))
    return mw.returnJson(True, msg)


def addDb():
    args = getArgs()
    data = checkArgs(args, ['password', 'name', 'db_user', 'dataAccess'])
    if not data[0]:
        return data[1]

    address = ''
    if 'address' in args:
        address = args['address'].strip()

    dbname = args['name'].strip()
    dbuser = args['db_user'].strip()
    password = args['password'].strip()
    dataAccess = args['dataAccess'].strip()

    listen_ip = "127.0.0.1/32"
    if 'listen_ip' in args:
        listen_ip = args['listen_ip'].strip()

    if not re.match(r"(?:[0-9]{1,3}\.){3}[0-9]{1,3}/\d+", listen_ip):
        return mw.returnJson(False, "你输入的权限不合法，添加失败！")

    # # 修改监听所有地址
    # if listen_ip not in ["127.0.0.1/32", "localhost", "127.0.0.1"]:
    #     sedConf("listen_addresses", "'*'")

    reg = "^[\w\.-]+$"
    if not re.match(reg, args['name']):
        return mw.returnJson(False, '数据库名称不能带有特殊符号!')

    checks = ['root', 'mysql', 'test', 'sys', 'postgres', 'postgresql']
    if dbuser in checks or len(dbuser) < 1:
        return mw.returnJson(False, '数据库用户名不合法!')
    if dbname in checks or len(dbname) < 1:
        return mw.returnJson(False, '数据库名称不合法!')

    if len(password) < 1:
        password = mw.md5(time.time())[0:8]

    pdb = pgDb()
    psdb = pSqliteDb('databases')
    if psdb.where("name=? or username=?", (dbname, dbuser)).count():
        return mw.returnJson(False, '数据库或用户已存在!')

    r = pdb.execute("create database " + dbname)
    r = pdb.execute("create user " + dbuser)
    pdb.execute("alter user {} with password '{}'".format(dbuser, password,))
    pdb.execute(
        "GRANT ALL PRIVILEGES ON DATABASE {} TO {}".format(dbname, dbuser,))

    pg_hba = getServerDir() + "/data/pg_hba.conf"

    content = mw.readFile(pg_hba)
    content += "\nhost    {}  {}    {}    md5".format(
        dbname, dbuser, listen_ip)
    mw.writeFile(pg_hba, content)

    addTime = time.strftime('%Y-%m-%d %X', time.localtime())
    psdb.add('pid,name,username,password,accept,ps,addtime',
             (0, dbname, dbuser, password, address, dbname, addTime))

    restart()
    return mw.returnJson(True, '添加成功!')


def delDb():
    args = getArgs()
    data = checkArgs(args, ['id', 'name'])
    if not data[0]:
        return data[1]

    did = args['id']
    name = args['name']

    pdb = pgDb()
    psdb = pSqliteDb('databases')
    pdb.execute("drop database " + name)

    username = psdb.where('id=?', (did,)).getField('username')
    pdb.execute("drop user " + username)

    pg_hba = getServerDir() + "/data/pg_hba.conf"
    old_config = mw.readFile(pg_hba)
    new_config = re.sub(r'host\s*{}.*'.format(name), '', old_config).strip()
    mw.writeFile(pg_hba, new_config)

    psdb.where("id=?", (did,)).delete()
    return mw.returnJson(True, '删除成功!')


def installPreInspection(version):
    return 'ok'


def uninstallPreInspection(version):
    return 'ok'

if __name__ == "__main__":
    func = sys.argv[1]

    version = "14.4"
    version_pl = getServerDir() + "/version.pl"
    if os.path.exists(version_pl):
        version = mw.readFile(version_pl).strip()

    if func == 'status':
        print(status(version))
    elif func == 'start':
        print(start(version))
    elif func == 'stop':
        print(stop(version))
    elif func == 'restart':
        print(restart(version))
    elif func == 'reload':
        print(reload(version))
    elif func == 'initd_status':
        print(initdStatus())
    elif func == 'initd_install':
        print(initdInstall())
    elif func == 'initd_uninstall':
        print(initdUinstall())
    elif func == 'install_pre_inspection':
        print(installPreInspection(version))
    elif func == 'uninstall_pre_inspection':
        print(uninstallPreInspection(version))
    elif func == 'conf':
        print(getConf())
    elif func == 'pg_hba_conf':
        print(pgHbaConf())
    elif func == 'config_tpl':
        print(configTpl())
    elif func == 'read_config_tpl':
        print(readConfigTpl())
    elif func == 'run_info':
        print(runInfo())
    elif func == 'run_log':
        print(runLog())
    elif func == 'slow_log':
        print(getSlowLog())
    elif func == 'db_status':
        print(pgDbStatus())
    elif func == 'set_db_status':
        print(pgSetDbStatus())
    elif func == 'pg_port':
        print(getPgPort())
    elif func == 'set_pg_port':
        print(setPgPort())
    elif func == 'get_db_list':
        print(getDbList())
    elif func == 'add_db':
        print(addDb())
    elif func == 'del_db':
        print(delDb())
    elif func == 'sync_get_databases':
        print(syncGetDatabases())
    else:
        print('error')

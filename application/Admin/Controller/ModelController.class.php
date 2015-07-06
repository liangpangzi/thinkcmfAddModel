<?php
/**
 * 模型管理
 */
namespace Admin\Controller;
use Common\Controller\AdminbaseController;

class ModelController extends AdminbaseController {

    protected $model_model;

    function _initialize() {
        parent::_initialize();
        $this->model_model = D("Common/Model");
    }

    /**
     * 模型管理首页
     */
    public function index() {
        $_SESSION['admin_menu_index']="Model/index";
        $result = $this->model_model->select();
        import("Tree");
        $tree = new \Tree();
        $tree->icon = array('&nbsp;&nbsp;&nbsp;│ ', '&nbsp;&nbsp;&nbsp;├─ ', '&nbsp;&nbsp;&nbsp;└─ ');
        $tree->nbsp = '&nbsp;&nbsp;&nbsp;';
        
        $newmenus=array();
        foreach ($result as $m){
            $newmenus[$m['id']]=$m;
             
        }
        foreach ($result as $n=> $r) {
            $result[$n]['str_manage'] = '<a href="' . U("model/edit", array("id" => $r['id'],"menuid" => $_GET['menuid'])) . '">修改</a> | <a class="J_ajax_del" href="' . U("Model/del", array("id" => $r['id']) ). '">删除</a> |<a href="'.U('Attribute/index?model_id='.$r['id']).'" >字段管理</a>';
            $result[$n]['status'] = $r['status'] ? "显示" : "隐藏";
            if(APP_DEBUG){
                $result[$n]['app']=$r['app']."/".$r['model']."/".$r['action'];
            }
        }

        $tree->init($result);
        $str = "<tr id='node-\$id' \$parentid_node>
                    <td>\$id</td>
                    <td>\$title</td>
                    <td>\$name</td>
                    <td>\$create_time</td>
                    <td>\$str_manage</td>
                </tr>";
        $categorys = $tree->get_tree(0, $str);
        $this->assign("categorys", $categorys);
        $this->display();
    }

    /**
     * 新增页面初始化
     */
    public function add(){
        $this->display();
    }

    /**
     * 编辑页面初始化
     */
    public function edit(){
        $id = I('get.id','');
        if(empty($id)){
            $this->error('参数不能为空！');
        }

        /*获取一条记录的详细数据*/
        $Model = M('Model');
        $data = $Model->field(true)->find($id);
        if(!$data){
            $this->error($Model->getError());
        }

        $fields = M('Attribute')->where(array('model_id'=>$data['id']))->field('id,name,title,is_show')->select();
        //是否继承了其他模型
        if($data['extend'] != 0){
            $extend_fields = M('Attribute')->where(array('model_id'=>$data['extend']))->field('id,name,title,is_show')->select();
            $fields = array_merge($fields, $extend_fields);
        }

        /* 获取模型排序字段 */
        $field_sort = json_decode($data['field_sort'], true);
        if(!empty($field_sort)){
        	/* 对字段数组重新整理 */
        	$fields_f = array();
        	foreach($fields as $v){
        		$fields_f[$v['id']] = $v;
        	}
        	$fields = array();
        	foreach($field_sort as $key => $groups){
        		foreach($groups as $group){
        			$fields[$fields_f[$group]['id']] = array(
        					'id' => $fields_f[$group]['id'],
        					'name' => $fields_f[$group]['name'],
        					'title' => $fields_f[$group]['title'],
        					'is_show' => $fields_f[$group]['is_show'],
        					'group' => $key
        			);
        		}
        	}
        	/* 对新增字段进行处理 */
        	$new_fields = array_diff_key($fields_f,$fields);
        	foreach ($new_fields as $value){
        		if($value['is_show'] == 1){
        			array_unshift($fields, $value);
        		}
        	}
        }

        $this->assign('fields', $fields);
        $this->assign('info', $data);
        $this->meta_title = '编辑模型';
        $this->display();
    }

    /**
     * 删除一条数据
     */
    public function del(){
        $id = I('get.id');
        empty($id) && $this->error('参数不能为空！');
        $res = $this->model_model->del($id);

        if(!$res){
            $this->error($this->model_model->getError());
        }else{
            $this->success('删除模型成功！');
        }
    }

    /**
     * 添加一条数据
     */
    public function add_post(){
        
        if (IS_POST) {
            if ($this->model_model->create()) {
                if ($this->model_model->add()!==false) {
                    $to=empty($_SESSION['admin_model_index'])?"Model/index":$_SESSION['admin_model_index'];
                    $this->success("添加成功！", U($to));
                } else {
                    $this->error("添加失败！");
                }
            } else {
                $this->error($this->model_model->getError());
            }
        }
    }

    /**
     * 更新一条数据
     */
    public function edit_post(){
        
        if (IS_POST) {
            if ($this->model_model->create()) {
                if ($this->model_model->save()!==false) {
                    $to=empty($_SESSION['admin_model_index'])?"Model/index":$_SESSION['admin_model_index'];
                    $this->success("更新成功！", U($to));
                } else {
                    $this->error("更新失败！");
                }
            } else {
                $this->error($this->model_model->getError());
            }
        }
    }

    /**
     * 生成模型
     */
    public function generate(){
        if(!IS_POST){
            //获取所有的数据表
            $tables = $this->model_model->getTables();
            $this->assign('tables', $tables);
            $this->meta_title = '生成模型';
            $this->display();
        }else{
            $table = I('post.table');
            empty($table) && $this->error('请选择要生成的数据表！');
            $res = $this->model_model->generate($table);
            if($res){
                $this->success('生成模型成功！', U('index'));
            }else{
                $this->error($this->model_model->getError());
            }
        }
    }

}

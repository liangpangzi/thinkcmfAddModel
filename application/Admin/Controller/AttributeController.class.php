<?php
/**
 * 字段管理
 */
namespace Admin\Controller;
use Common\Controller\AdminbaseController;

/**
 * 属性控制器
 * @author huajie <banhuajie@163.com>
 */
class AttributeController extends AdminbaseController {

    protected $attribute_model;

    function _initialize() {
        parent::_initialize();
        $this->attribute_model = D("Common/Attribute");
    }

    /**
     * 属性列表
     * @author huajie <banhuajie@163.com>
     */
    public function index(){
        $model_id   =   I('get.model_id');
        $count=$this->attribute_model->where(array("model_id"=>$model_id))->count();
        $page = $this->page($count, 20);
        $users = $this->attribute_model
        ->where(array("model_id"=>$model_id))
        ->order("create_time DESC")
        ->limit($page->firstRow . ',' . $page->listRows)
        ->select();
        
        $this->assign("page", $page->show('Admin'));
        $this->assign("users",$users);
        $this->assign("model_id",$model_id);
        $this->display();
    }

    /**
     * 新增页面初始化
     * @author huajie <banhuajie@163.com>
     */
    public function add(){
        $model_id   =   I('get.model_id');
        $info       =  array('model_id'=>$model_id);
        $this->assign('model_id', $model_id);
        $this->assign('info', $info);
        $this->display('edit');
    }

    /**
     * 编辑页面初始化
     * @author huajie <banhuajie@163.com>
     */
    public function edit(){
        $id = I('get.id','');
        if(empty($id)){
            $this->error('参数不能为空！');
        }

        /*获取一条记录的详细数据*/
        $Model = M('Attribute');
        $data = $Model->field(true)->find($id);
        if(!$data){
            $this->error($Model->getError());
        }
        $model  =   M('Model')->field('title,name,field_group')->find($data['model_id']);
        $this->assign('model',$model);
        $this->assign('info', $data);
        $this->meta_title = '编辑属性';
        $this->display();
    }

    /**
     * 更新一条数据
     * @author huajie <banhuajie@163.com>
     */
    public function update(){
        $res = $this->attribute_model->update();
        if(!$res){
            $this->error($this->attribute_model->getError());
        }else{
            $this->success($res['id']?'更新成功':'新增成功', Cookie('__forward__'));
        }
    }

    /**
     * 删除一条数据
     * @author huajie <banhuajie@163.com>
     */
    public function remove(){
        $id = I('id');
        empty($id) && $this->error('参数错误！');

        $Model = D('Attribute');

        $info = $Model->getById($id);
        empty($info) && $this->error('该字段不存在！');

        //删除属性数据
        $res = $Model->delete($id);

        //删除表字段
        $Model->deleteField($info);
        if(!$res){
            $this->error(D('Attribute')->getError());
        }else{
            //记录行为
            action_log('update_attribute', 'attribute', $id, UID);
            $this->success('删除成功', U('index','model_id='.$info['model_id']));
        }
    }
}

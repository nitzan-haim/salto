import wu from 'wu'
import _ from 'lodash'
import { getChangeElement } from 'adapter-api'
import * as mock from '../../common/elements'
import { getFirstPlanItem, getChange } from '../../common/plan'
import { planGenerators } from './plan.test'

describe('PlanItem', () => {
  const allElements = mock.getAllElements()

  const {
    planWithTypeChanges,
    planWithFieldChanges,
    planWithNewType,
    planWithInstanceChange,
    planWithListChange,
    planWithAnnotationTypesChanges,
    planWithFieldIsListChanges,
  } = planGenerators(allElements)

  describe('parent method', () => {
    it('should return group level change', async () => {
      const [plan, changedElem] = await planWithTypeChanges()
      const planItem = getFirstPlanItem(plan)
      const groupLevelChange = getChange(planItem, changedElem.elemID)
      expect(planItem.parent()).toBe(groupLevelChange)
    })
    it('should create modify parent if none exists', async () => {
      const [plan, changedElem] = await planWithFieldChanges()
      const planItem = getFirstPlanItem(plan)
      const parent = planItem.parent()
      expect(parent.action).toEqual('modify')
      expect(getChangeElement(parent).elemID).toEqual(changedElem.elemID)
    })
  })

  describe('detailedChange method', () => {
    it('should break field modification to specific value changes', async () => {
      const [plan, newElement] = await planWithTypeChanges()
      const planItem = getFirstPlanItem(plan)
      const changes = [...planItem.detailedChanges()]
      expect(changes).toHaveLength(2)

      expect(changes[0].id).toEqual(newElement.elemID.createNestedID('attr', 'label'))
      expect(changes[0].action).toEqual('add')
      expect(_.get(changes[0].data, 'after')).toEqual(newElement.annotations.label)

      expect(changes[1].id).toEqual(newElement.elemID.createNestedID('attr', 'new'))
      expect(changes[1].action).toEqual('add')
      expect(_.get(changes[1].data, 'after')).toEqual(newElement.annotations.new)
    })
    it('should return field changes with the correct id', async () => {
      const [plan, newElement] = await planWithFieldChanges()
      const planItem = getFirstPlanItem(plan)
      const changes = [...planItem.detailedChanges()]
      expect(changes).toHaveLength(2)

      expect(changes[0].id).toEqual(newElement.fields.new.elemID)
      expect(changes[0].action).toEqual('add')

      expect(changes[1].id).toEqual(newElement.fields.location.elemID.createNestedID('label'))
      expect(changes[1].action).toEqual('modify')
      expect(_.get(changes[1].data, 'after')).toEqual(newElement.fields.location.annotations.label)
    })
    it('should return add / remove changes at the appropriate level', async () => {
      const [plan, newElement] = await planWithNewType()
      const planItem = getFirstPlanItem(plan)
      const changes = [...planItem.detailedChanges()]
      expect(changes).toHaveLength(1)
      expect(changes[0].id).toEqual(newElement.elemID)
    })
    it('should return deep nested changes', async () => {
      const [plan, updatedInst] = await planWithInstanceChange()
      const planItem = getFirstPlanItem(plan)
      const changes = [...planItem.detailedChanges()]
      expect(changes).toHaveLength(2)
      const [listChange, nameRemove] = changes
      expect(listChange.action).toEqual('modify')
      expect(listChange.id).toEqual(updatedInst.elemID.createNestedID('nicknames', '1'))
      expect(nameRemove.action).toEqual('remove')
      expect(nameRemove.id).toEqual(updatedInst.elemID.createNestedID('office', 'name'))
    })
    it('should return list modification when a value is added', async () => {
      const [plan, updatedInst] = await planWithListChange()
      const planItem = getFirstPlanItem(plan)
      const changes = [...planItem.detailedChanges()]
      expect(changes).toHaveLength(1)
      const [listChange] = changes
      expect(listChange.action).toEqual('modify')
      expect(listChange.id).toEqual(updatedInst.elemID.createNestedID('nicknames'))
    })

    it('should return only top level change in case of annotationType change', async () => {
      const [plan, obj] = await planWithAnnotationTypesChanges()
      const planItem = getFirstPlanItem(plan)
      const changes = [...planItem.detailedChanges()]
      expect(changes).toHaveLength(1)
      const [annoChange] = changes
      expect(annoChange.action).toEqual('modify')
      expect(annoChange.id).toEqual(obj.elemID)
    })

    it('should return is list value modification when a field is changed to list', async () => {
      const [plan, changedElem] = await planWithFieldIsListChanges()
      const planItem = getFirstPlanItem(plan)
      const changes = wu(planItem.detailedChanges()).toArray()
      expect(changes).toHaveLength(1)
      const [listChange] = changes
      expect(listChange.action).toEqual('modify')
      expect(listChange.id).toEqual(changedElem.fields.name.elemID)
      expect(_.get(listChange.data, 'after').isList).toBe(true)
    })
  })
})
